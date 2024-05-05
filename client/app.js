/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 563:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   u: () => (/* binding */ Component)
/* harmony export */ });
/* harmony import */ var _state_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(717);


String.prototype.toDOM = function () {
    let div = document.createElement("div");
    div.innerHTML = this;
    return div.childNodes[0];
}

class ComponentRegistry {
    static #registry = {};
    static #regsitryClassNames = [];
    getRegisteredClassNames = () => {
        return ComponentRegistry.#regsitryClassNames;
    }
    getRegisteredClassByName = (className) => {
        return ComponentRegistry.#registry[className];
    }
    register = (componentClass, name) => {
        let className = name == null ? componentClass.name.toUpperCase() : name.toUpperCase();
        ComponentRegistry.#registry[className] = componentClass;
        ComponentRegistry.#regsitryClassNames.push(className);
    }

    #components = [];
    addComponent(component) {
        this.#components.push(component);
    }
    getComponentById(id) {
        return this.#components.find(c => c.id == id);
    }
}

class Component {
    static #componentRegistry = new ComponentRegistry();
    static register = (componentClass, name = null) => {
        this.#componentRegistry.register(componentClass, name);
    }
    static render = async (dom, parentComponent = null) => {
        let nodeName = dom.nodeName.toUpperCase();
        if (Component.#componentRegistry.getRegisteredClassNames().includes(nodeName)) {
            let componentClass = Component.#componentRegistry.getRegisteredClassByName(nodeName);
            let component = new componentClass();
            component.parent = parentComponent;
            for (let attrName of dom.getAttributeNames()) {
                let attrValue = dom.getAttribute(attrName);
                if (attrName.includes("()")) {
                    let attrValue = dom.getAttribute(attrName);
                    dom.removeAttribute(attrName);
                    attrName = attrName.replaceAll("()", "");
                    if (component.parent != null) {
                        component.addEventListener(attrName, async (value) => {
                            let parent = component.parent;
                            attrValue = attrValue.replaceAll("{{", "").replaceAll("}}", "");
                            parent.callAction(attrValue, value);
                        });
                    }
                } else {
                    if (attrName.includes("[]")) {
                        attrName = attrName.replaceAll('[]', '');
                        let code = attrValue.replaceAll("{{", "").replaceAll("}}", "");
                        if (component.parent != null) {
                            component.subscribe("this." + attrName, async () => {
                                let newValue = component[attrName];
                                if (typeof newValue === 'object') {
                                    newValue = JSON.stringify(newValue);
                                }
                                await component.parent.callAction(`(async () => {${code} = '${newValue}'})()`);
                            });
                        }
                    }
                    try {
                        if (component.parent != null) {
                            let values = await component.parent.evalValue(attrValue);
                            try {
                                component[attrName] = JSON.parse(values.data);
                            } catch {
                                component[attrName] = values.data;
                            }
                            for (let code of values.codes) {
                                let dataKey = code.match(/([\w.]+)/)[1];
                                component.parent.subscribe(dataKey, async () => {
                                    await component.callAction(async () => {
                                        let value = await component.parent.evalValue(attrValue);
                                        try {
                                            component[attrName] = JSON.parse(value.data);
                                        } catch {
                                            component[attrName] = value.data;
                                        }
                                    });
                                });
                            }
                        } else {
                            try {
                                component[attrName] = JSON.parse(attrValue);
                            } catch {
                                component[attrName] = attrValue;
                            }
                        }
                    } catch {
                        component[attrName] = dom.getAttribute(attrName);
                    }
                }
            }
            Component.#componentRegistry.addComponent(component);
            let newDOM = await component.#process();

            function findChild(d) {
                let output = null;
                if (d.getAttribute != null) {
                    output = d.getAttribute(":childs");
                    d.removeAttribute(":childs");
                }
                if (output != null) return d;
                if (d.childNodes != null) {
                    for (let child of d.childNodes) {
                        output = findChild(child);
                        if (output != null) return child;
                    }
                }
                return null;
            }

            let targetNode = findChild(newDOM);
            targetNode = targetNode == null ? newDOM : targetNode;
            if (dom.childNodes != null) {
                let tmp = [];
                for (let child of dom.childNodes) {
                    tmp.push(child);
                }
                for (let child of tmp) {
                    component.onAttachChild(child);
                    targetNode.appendChild(child);
                }
            }
            component.onDefineCSSClass(dom.classList, newDOM);
            component.onDefinStyle(dom.style, newDOM);
            dom.replaceWith(newDOM);
            dom = newDOM;
            await component.#processExternalScript();
            component.dom = newDOM;
            if (parentComponent != null) parentComponent.addChildComponent(component);
            parentComponent = component;
        }
        if (dom.childNodes != null) {
            for (let child of dom.childNodes) {
                await Component.render(child, parentComponent);
            }
        }
    }

    onDefinStyle = (style, newDOM) => {
        newDOM.style.cssText = style.cssText;
    }

    onDefineCSSClass = (classList, newDOM) => {
        for (let c of classList) {
            newDOM.classList.add(c);
        }
    }

    #state = new _state_js__WEBPACK_IMPORTED_MODULE_0__/* .State */ .U(this);

    get state() {
        return this.#state;
    }

    async #process() {
        let template = await this.onTemplateBuilding();
        let renderedDOM = template.toDOM();
        await this.onTemplateBuilt(renderedDOM);
        await this.onInitializing();
        await this.#flow(renderedDOM);
        await this.#bind(renderedDOM);
        await this.onFinalizing(renderedDOM);
        return renderedDOM;
    }

    async #evalData(dom, data) {
        let output = {};
        output.codes = [];
        let matchResult = data.matchAll(/\{\{[^\{\}]*\}\}/g);
        let isMatched = false;
        for (let match of matchResult) {
            let code = match[0];
            let i = 0;
            let evaluatedValue = eval(code);
            if (typeof evaluatedValue === 'object') {
                evaluatedValue = JSON.stringify(evaluatedValue);
            }
            data = data.replaceAll(code, evaluatedValue);
            output.codes.push(code);
            isMatched = true;
        }
        output.data = data;
        return output;
    }

    async #evalAttribute(dom, attrName, attrValue) {
        let nodeName = dom.nodeName.toUpperCase();
        if (Component.#componentRegistry.getRegisteredClassNames().includes(dom.nodeName)) return;
        if (attrName.includes("()")) {
            let eventName = attrName.replaceAll("()", "");
            dom.addEventListener(eventName.toLowerCase(), async () => {
                let target = dom;
                attrValue = attrValue.replaceAll("{{", "").replaceAll("}}", "");
                let cmd = `(async () => {await this.#state.save();await ${attrValue};await this.#state.change();await this.#processExternalScript();})();`;
                eval(cmd);
            });
            dom.removeAttribute(attrName)
        } else if (attrName.includes("(*)")) {
            let eventName = attrName.replaceAll("(*)", "");
            dom.addEventListener(eventName.toLowerCase(), async () => {
                let target = dom;
                attrValue = attrValue.replaceAll("{{", "").replaceAll("}}", "");
                let cmd = `(async () => {await ${attrValue}})();`;
                eval(cmd);
            });
            dom.removeAttribute(attrName)
        } else if (attrName.includes("[]")) {
            attrName = attrName.replaceAll("[]", "");
            let processedData = await this.#evalData(dom, attrValue);
            if (processedData.codes.length > 0) {
                if (attrName == "VALUE") {
                    dom.value = processedData.data;
                    if (dom.nodeName.toLowerCase() == "select") {
                        dom.setAttribute(attrName, processedData.data);
                    }
                } else {
                    dom.setAttribute(attrName, processedData.data);
                }
                this.#state.createState(processedData, dom, attrValue, "ATTRIBUTE", attrName);
                if (dom.nodeName.toLowerCase() == "select") {
                    dom.addEventListener("change", async (evt) => {
                        await this.#state.save();
                        let value = evt.target.value;
                        for (let code of processedData.codes) {
                            code = code.replaceAll("{{", "").replaceAll("}}", "");
                            eval(`${code} = '${value}'`);
                        }
                        await this.#state.change();
                        await this.#processExternalScript();
                    });
                }
                else {
                    dom.addEventListener("input", async (evt) => {
                        await this.#state.save();
                        let value = evt.target.value;
                        for (let code of processedData.codes) {
                            code = code.replaceAll("{{", "").replaceAll("}}", "");
                            eval(`${code} = '${value}'`);
                        }
                        await this.#state.change();
                        await this.#processExternalScript();
                    });
                }
            }
        } else {
            let processedData = await this.#evalData(dom, attrValue);
            if (processedData.codes.length > 0) {
                if (attrName == "VALUE") {
                    dom.value = processedData.data;
                } else {
                    dom.setAttribute(attrName, processedData.data);
                }
                this.#state.createState(processedData, dom, attrValue, "ATTRIBUTE", attrName);
            }
        }
    }

    async bindAttribute(dom, attrName) {
        this.#state.changeMode();
        let attrValue = dom.getAttribute(attrName);
        await this.#evalAttribute(dom, attrName.toUpperCase(), attrValue, false);
    }

    async bindContent(dom) {
        this.#state.changeMode();
        await this.#evalContent(dom, false);
    }

    async #evalContent(dom) {
        let data = dom.data;
        let processedData = await this.#evalData(dom, data);
        if (processedData.codes.length > 0) {
            dom.data = processedData.data;
            this.#state.createState(processedData, dom, data, "DATA");
        }
    }

    async #evalForLoop(dom, attrName, attrValue, stackVariables = []) {
        let output = [];
        let forCommand = attrValue.replaceAll("{{", "").replaceAll("}}", "");
        let template = dom.cloneNode(true);
        let words = forCommand.split(" of ");
        let itemVar = words[0].trim();
        let formula = words[1].trim();
        stackVariables.push({formula, itemVar});
        let listVar = eval(words[1].trim());
        let root = [];
        let i = 0;
        let parent = dom.parentNode;
        let convertVariableToFullFormula = (dom, index, stackVariables) => {
            let findAndReplaceVariableName = (attrValue, stackVariables) => {
                for (let variable of stackVariables) {
                    attrValue = attrValue.replaceAll(variable.itemVar, variable.formula + "[" + index + "]")
                }
                return attrValue;
            }
            if (dom.getAttributeNames) {
                for (let attrName of dom.getAttributeNames()) {
                    if (!attrName.includes("()") && !attrName.includes("(*)")) {
                        let attrValue = dom.getAttribute(attrName);
                        attrValue = findAndReplaceVariableName(attrValue, stackVariables)
                        dom.setAttribute(attrName, attrValue);
                    }
                }
            }
            if (dom.nodeName == "#text") {
                dom.data = findAndReplaceVariableName(dom.data, stackVariables)
            }
            if (dom.childNodes) {
                for (let child of dom.childNodes) {
                    convertVariableToFullFormula(child, index, stackVariables);
                }
            }
        }
        if (listVar == null) listVar = [];
        if (listVar.length > 0) {
            for (let item of listVar) {
                if (i == 0) {
                    let newDom = template.cloneNode(true);
                    dom.replaceWith(newDom);
                    convertVariableToFullFormula(newDom, i, stackVariables);
                    dom = newDom;
                } else {
                    let newDom = template.cloneNode(true);
                    if (dom.nextSibling) {
                        parent.insertBefore(newDom, dom.nextSibling);
                    } else {
                        parent.appendChild(newDom);
                    }
                    convertVariableToFullFormula(newDom, i, stackVariables);
                    dom = newDom;
                }
                output.push(dom);
                i++;
            }
        } else {
            let _dom = document.createElement("div");
            dom.replaceWith(_dom);
            output = [_dom];
        }
        if (Array.isArray(listVar)) {
            template.setAttribute(":FOR", attrValue);
            this.#state.createArrayState(words[1].trim(), output, template);
        }
        return output;
    }

    async evalFor(dom) {
        await this.#flow(dom);
        await this.#bind(dom);
    }

    async #flow(dom) {
        let renderedDOMs = [];
        let isFor = false;
        if (dom.getAttributeNames) {
            if (dom.getAttributeNames().length > 0) {
                for (let attrName of dom.getAttributeNames()) {
                    attrName = attrName.toUpperCase();
                    let attrValue = dom.getAttribute(attrName);
                    if (attrName == ":IF") {
                        dom.removeAttribute(attrName);
                        dom.setAttribute('ckn-display', attrValue);
                    }
                    if (attrName == ":FOR") {
                        isFor = true;
                        dom.removeAttribute(attrName);
                        let tmp = await this.#evalForLoop(dom, attrName, attrValue);
                        for (let t of tmp) {
                            renderedDOMs.push(t);
                        }
                    }
                }
            }
        }
        if (renderedDOMs.length == 0 && !isFor) {
            renderedDOMs.push(dom);
        }
        for (let item of renderedDOMs) {
            if (item.childNodes) {
                for (let child of item.childNodes) {
                    await this.#flow(child);
                }
            }
        }
    }

    async #bind(dom) {
        await this.onBinding(dom);
        if (dom.nodeName == "#text") {
            await this.#evalContent(dom);
        } else if (dom.getAttributeNames != null) {
            for (let attrName of dom.getAttributeNames()) {
                let attrValue = dom.getAttribute(attrName);
                await this.#evalAttribute(dom, attrName.toUpperCase(), attrValue);
            }
        }
        if (dom.childNodes != null) {
            for (let child of dom.childNodes) {
                await this.#bind(child);
            }
        }
        await this.onBound(dom);
    }

    async #processExternalScript() {
        let elems = document.querySelectorAll("[ckn-display]");
        for (let ele of elems) {
            let value = ele.getAttribute("ckn-display");
            if (value.toUpperCase() == "TRUE") {
                ele.style.display = "";
            } else if (value.toUpperCase() == "FALSE") {
                ele.style.display = "none";
            }
        }
        /*
        elems = document.querySelectorAll("select[value]");
        for (let ele of elems) {
            let value = ele.getAttribute("value");
            ele.value = value;
        }
        */
        await this.onProcessExternalScript();
    }

    // BEGIN: Component life cycle
    async onTemplateBuilding() {
        return `<div></div>`;
    }

    async onTemplateBuilt(renderedDOM) {
    }

    async onInitializing() {
    }

    async onBinding(bindingDOM) {

    }

    async onBound(renderedDOM) {

    }

    async onFinalizing(renderedDOM) {
    }

    async onProcessExternalScript() {

    }

    async onAttachChild(dom) {
    }


    // END: Component life cycle
    async callAction(action, value = null) {
        if (typeof action === "string") {
            eval(`(async () => {
                await this.#state.save();
                await ${action};
                await this.#state.change();
                await this.#processExternalScript();
            })()`)
        } else {
            await this.#state.save();
            await action(value);
            await this.#state.change();
            await this.#processExternalScript();
        }
    }

    async subscribe(code, process) {
        await this.#state.subscribe(code, process);
    }

    #events = {};

    addEventListener(name, process) {
        name = name.toUpperCase();
        if (this.#events[name] == null) {
            this.#events[name] = [];
        }
        this.#events[name].push(process);
    }

    async callEvent(eventName, value = null) {
        let events = this.#events[eventName.toUpperCase()];
        if (events != null) {
            for (let event of events) {
                await event(value);
            }
        }
    }

    async evalValue(value) {
        return this.#evalData(this.dom, value);
    }



    #childComponents = [];
    addChildComponent(component) {  
        this.#childComponents.push(component);
    }
    getComponentById(id) {
        return this.#childComponents.find(c => c.id == id);
    }
}



/***/ }),

/***/ 717:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   U: () => (/* binding */ State)
/* harmony export */ });
class State {
    constructor(component) {
        this.#component = component;
        this.#registry.getStates = (name) => {
            let names = Object.keys(this.#registry);
            names = names.filter(n => n.includes(name));
            let output = [];
            for (let n of names) {
                output.push(this.#registry[n]);
            }
            return output;
        };
    }

    #component = null;
    #mode = 0;

    changeMode() {
        this.#mode = 1;
    }

    #registry = {};
    createArrayState = (code, doms, template = []) => {
        if (this.#registry[code] == null) {
            this.#registry[code] = [];
        }
        this.#registry[code] = this.#registry[code].filter(s => s.dom.filter(a => a.parentNode != null).length > 0);
        this.#registry[code].push({
            code: code,
            dom: doms,
            template: template,
            type: "ARRAY",
            name: ""
        });
    }
    createState = (processedData, dom, template, type = "ATTRIBUTE", name = "") => {
        if (this.#mode == 0) {
            let codes = processedData.codes;
            for (let code of codes) {
                let matches = code.matchAll(/(\w[a-zA-Z0-9_.\[\]]+)/g);
                for (let matched of matches) {
                    code = matched[0];
                    if (this.#registry[code] == null) {
                        this.#registry[code] = [];
                    }
                    this.#registry[code].push({
                        code: code,
                        dom: dom,
                        template: template,
                        type: type,
                        name: name
                    });
                }
            }
        }
    }

    #lastedState = null;
    #subscriptions = {};

    async subscribe(code, process) {
        if (this.#subscriptions[code] == null) {
            this.#subscriptions[code] = [];
        }
        this.#subscriptions[code].push(process);
    }

    async #executeSubscription(code) {
        let subscriptions = this.#subscriptions[code];
        if (subscriptions != null) {
            for (let subscription of subscriptions) {
                await subscription();
            }
        }
    }

    getLastState() {
        return JSON.parse(JSON.stringify(this.#lastedState));
    }

    async save() {
        let obj = {};
        let keys = Object.keys(this.#component);
        keys = keys.filter(s => !['parent', 'dom'].includes(s.toLowerCase()));
        for (let key of keys) {
            if ((Array.isArray(this.#component[key]) || typeof this.#component[key] === 'object')){
                obj[key] = JSON.parse(JSON.stringify(this.#component[key]));
            } else if (typeof this.#component[key] === "number" || typeof this.#component[key] === "string" || typeof this.#component[key] === "boolean") {
                obj[key] = this.#component[key];
            }
        }
        this.#lastedState = obj;
    }

    async change() {
        let keys = Object.keys(this.#lastedState);
        keys = keys.filter(s => !['parent', 'dom'].includes(s.toLowerCase()));
        let keyChangeds = [];
        for (let key of keys) {
            if (typeof this.#component[key] === "number" || typeof this.#component[key] === "string" || typeof this.#component[key] === "boolean") {
                if (this.#lastedState[key] != this.#component[key]) {
                    keyChangeds.push(key);
                    let states = this.#registry["this." + key];
                    if (states != null) {
                        for (let state of states) {
                            let dom = state.dom;
                            switch (state.type) {
                                case "ATTRIBUTE":
                                    let name = state.name;
                                    dom.setAttribute(name, state.template);
                                    await this.#component.bindAttribute(dom, name);
                                    break;
                                case "DATA":
                                    dom.data = state.template;
                                    await this.#component.bindContent(dom);
                                    break;
                            }
                        }
                    }
                }
            } else if (this.#component[key] != null && Array.isArray(this.#component[key])) {
                if (this.#lastedState[key].length != this.#component[key].length) {
                    keyChangeds.push(key);
                    let relatedKeys = Object.keys(this.#registry).filter(k => k.includes("this." + key));
                    for (let rkey of relatedKeys) {
                        let states = this.#registry[rkey];
                        if (states != null) {
                            //states = states.filter(s => s.type == "ARRAY");
                            for (let state of states) {
                                if (state.type == "ARRAY") {
                                    let clearStateKeys = Object.keys(this.#registry).filter(k => k.includes(rkey + "["));
                                    for (let k of clearStateKeys) {
                                        delete this.#registry[k];
                                    }
                                    if (state.dom.length > 0) {
                                        let parent = state.dom[0].parentNode;
                                        if (parent != null) {
                                            let template = state.template;
                                            let i = 0;
                                            for (let dom of state.dom) {
                                                if (i == 0) {
                                                    dom.replaceWith(template);
                                                } else {
                                                    dom.remove();
                                                }
                                                i++;
                                            }
                                            await this.#component.evalFor(parent);
                                        }
                                    }
                                }
                                else if (state.type == "DATA") {
                                    let dom = state.dom;
                                    dom.data = state.template;
                                    await this.#component.bindContent(dom);
                                    break;
                                }
                            }
                        }
                    }
                } else if (JSON.stringify(this.#lastedState[key]) != JSON.stringify(this.#component[key])) {
                    keyChangeds.push(key);
                    let states = this.#registry["this." + key];
                    if (states != null) {
                        for (let state of states) {
                            let dom = state.dom;
                            switch (state.type) {
                                case "ATTRIBUTE":
                                    let name = state.name;
                                    dom.setAttribute(name, state.template);
                                    await this.#component.bindAttribute(dom, name);
                                    break;
                                case "DATA":
                                    dom.data = state.template;
                                    await this.#component.bindContent(dom);
                                    break;
                                case "ARRAY":
                                    let parent = dom[0].parentNode;
                                    if (parent != null) {
                                        let template = state.template;
                                        let i = 0;
                                        for (let dom of state.dom) {
                                            if (i == 0) {
                                                dom.replaceWith(template);
                                            } else {
                                                dom.remove();
                                            }
                                            i++;
                                        }
                                        await this.#component.evalFor(parent);
                                    }
                                    break;
                            }
                        }
                    }
                }

            } else if (this.#component[key] != null && typeof this.#component[key] === "object") {
                if (JSON.stringify(this.#lastedState[key]) != JSON.stringify(this.#component[key])) {
                    keyChangeds.push(key);
                    let allStates = this.#registry.getStates("this." + key);
                    for (let states of allStates) {
                        for (let state of states) {
                            let dom = state.dom;
                            switch (state.type) {
                                case "ATTRIBUTE":
                                    let name = state.name;
                                    dom.setAttribute(name, state.template);
                                    await this.#component.bindAttribute(dom, name);
                                    break;
                                case "DATA":
                                    dom.data = state.template;
                                    await this.#component.bindContent(dom);
                                    break;
                            }
                        }
                    }
                }
            }
        }
        for (let key of keyChangeds) {
            await this.#executeSubscription("this." + key);
        }
    }
}




/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {

;// CONCATENATED MODULE: ./node_modules/ckn.core/core/ckn.log.js


class Log {
    #prefixs = null;

    constructor(...prefixs) {
        this.#prefixs = prefixs;
    }

    info(...msg) {
        let dateText = (new Date()).dateTimeDataFormat();
        console.log(dateText, ...this.#prefixs, ...msg);
    }

    error(...msg) {
        let dateText = (new Date()).dateTimeDataFormat();
        console.error(dateText, ...this.#prefixs, ...msg);
    }
}


;// CONCATENATED MODULE: ./node_modules/ckn.core/core/ckn.api.js


class Api {
    constructor() {
        this.log = new Log("CKN", "API");
    }

    async #initialFetchFunction() {
        let fetchFunc = null;
        fetchFunc = fetch;
        return fetchFunc;
    }

    async #extractDataFromResponse(response) {
        if (response == null) return null;
        let data = null;
        try {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json()
            } else {
                data = await response.text()
            }
        } catch (err) {
            this.log.error(err);
        }
        return data;
    }

    async get(url, headers = null) {
        let fetchFunction = await this.#initialFetchFunction();
        let response = null;
        try {
            response = headers == null
                ? await fetchFunction(url)
                : await fetchFunction(url, {
                    headers: headers
                });
        } catch (err) {
            this.log.error(err);
            response = null;
        }
        let result = await this.#extractDataFromResponse(response);
        return result;
    }

    async #fetch(url, data, headers = {}, method = "POST") {
        let fetchFunction = await this.#initialFetchFunction();
        if (headers['Content-Type'] == null) headers['Content-Type'] = headers['content-type'];
        if (headers['Content-Type'] == null) headers['Content-Type'] = 'application/json';
        if (headers['Accept'] == null) headers['Accept'] = headers['accept'];
        if (headers['Accept'] == null) headers['Accept'] = 'application/json';
        if (headers['Content-Type'].includes('application/json')) {
            data = JSON.stringify(data);
        } else if (headers['Content-Type'].includes('application/x-www-form-urlencoded')) {
            let tmp = "";
            Object.keys(data).forEach(key => {
                tmp += key + "=" + data[key] + "&";
            });
            data = tmp;
        }
        let response = null;
        try {
            response = await fetch(url, {
                method: method,
                headers: headers,
                body: data
            });
        } catch (error) {
            this.log.error(error);
        }
        let result = await this.#extractDataFromResponse(response);
        return result;
    }

    async post(url, data, headers = {}) {
        return await this.#fetch(url, data, headers, "POST");
    }

    async put(url, data, headers = {}) {
        return await this.#fetch(url, data, headers, "PUT");
    }

    async delete(url, data, headers = {}) {
        return await this.#fetch(url, data, headers, "DELETE");
    }

    async patch(url, data, headers = {}) {
        return await this.#fetch(url, data, headers, "PATCH");
    }
}


;// CONCATENATED MODULE: ./node_modules/ckn.core/core/ckn.number.js
Number.prototype.print = function () {
    console.log(this);
    return this;
}
Number.prototype.round = function () {
    return Math.round(this);
}
Number.prototype.ceil = function () {
    return Math.ceil(this);
}
Number.prototype.floor = function () {
    return Math.floor(this);
}
Number.prototype.printFormat = function (decimal_number, separate_thousands = ",") {
    if (decimal_number == null)
        return "" + this;
    else
        return this.toFixed(decimal_number).toString().replace(/\B(?=(\d{3})+(?!\d))/g, separate_thousands);
}
Number.prototype.padStart = function (targetLength, padString) {
    return this.toString().padStart(targetLength, padString);
}
Number.prototype.padEnd = function (targetLength, padString) {
    return this.toString().padEnd(targetLength, padString);
}
;// CONCATENATED MODULE: ./node_modules/ckn.core/core/ckn.string.js
String.prototype.print = function () {
    console.log(this);
    return this;
}
String.prototype.edit = function (editFunc) {
    let output = "";
    for (let i = 0; i < this.length; i++) {
        output += editFunc(this.charAt(i));
    }
    return output;
}
String.prototype.each = function (eachFunc) {
    for (let i = 0; i < this.length; i++) {
        eachFunc(this.charAt(i));
    }
}
String.prototype.first = function (n = 1) {
    let output = "";
    for (let i = 0; i < n && i < this.length; i++) {
        output += this[i];
    }
    return output;
}
String.prototype.last = function (n = 1) {
    let output = "";
    for (let i = this.length - n; i < this.length; i++) {
        output += this[i];
    }
    return output;
}
String.prototype.reverse = function () {
    let output = "";
    for (let i = this.length - 1; i >= 0; i--) {
        output += this[i];
    }
    return output;
}
String.prototype.distinct = function (distinctFunc) {
    let output = "";
    this.each(item => {
        if (distinctFunc == null) {
            if (!output.includes(item)) {
                output += item;
            }
        } else {
            if (!distinctFunc(item, output)) {
                output += item;
            }
        }
    });
    return output;
}
String.prototype.count = function (countFunc) {
    let output = 0;
    this.each(item => {
        if (countFunc == null) {
            output++;
        } else {
            if (countFunc(item)) {
                output++;
            }
        }
    });
    return output;
}
String.prototype.remove = function (removeFunc) {
    let output = "";
    this.each(item => {
        if (removeFunc == null) {
            output += item;
        } else {
            if (!removeFunc(item)) {
                output += item;
            }
        }
    });
    return output;
}
String.prototype.trim = function (charecters = [' ']) {
    let output = "";
    let start = 0;
    let end = this.length - 1;
    while (start < this.length && charecters.includes(this[start])) {
        start++;
    }
    while (end >= 0 && charecters.includes(this[end])) {
        end--;
    }
    for (let i = start; i <= end; i++) {
        output += this[i];
    }
    return output;
}
String.prototype.padLeft = function (n, c = ' ') {
    let output = "";
    for (let i = 0; i < n - this.length; i++) {
        output += c;
    }
    output += this;
    return output;
}
String.prototype.padRight = function (n, c = ' ') {
    let output = this;
    for (let i = 0; i < n - this.length; i++) {
        output += c;
    }
    return output;
}
String.prototype.padCenter = function (n, c = ' ') {
    let output = "";
    for (let i = 0; i < (n - this.length) / 2; i++) {
        output += c;
    }
    output += this;
    for (let i = 0; i < (n - this.length) / 2; i++) {
        output += c;
    }
    return output;
}
String.prototype.toNumber = function () {
    return Number(this);
}
String.prototype.toBoolean = function () {
    return this == "true";
}
String.prototype.toDate = function () {
    return new Date(new Date(this).toISOString().first(10));
}
String.prototype.toTime = function () {
    return new Date("1970-01-01 " + this);
}
String.prototype.toDateTime = function () {
    return new Date(this);
}
String.prototype.toTitleCase = function () {
    let output = "";
    let isSpace = true;
    this.each(item => {
        if (isSpace) {
            output += item.toUpperCase();
        } else {
            output += item.toLowerCase();
        }
        isSpace = item == ' ';
    });
    return output;
}
String.prototype.toSentenceCase = function () {
    let output = "";
    let isSpace = true;
    this.each(item => {
        if (isSpace) {
            output += item.toUpperCase();
        } else {
            output += item.toLowerCase();
        }
        isSpace = item == '.' || item == '!' || item == '?';
    });
    return output;
}
String.prototype.toCamelCase = function () {
    let output = "";
    let isSpace = true;
    this.each(item => {
        if (isSpace) {
            output += item.toUpperCase();
        } else {
            output += item.toLowerCase();
        }
        isSpace = item == ' ';
    });
    output = output.remove(item => item == ' ');
    output = output.replace(output[0], output[0].toLowerCase());
    return output;
}
String.prototype.toPascalCase = function () {
    let output = "";
    let isSpace = true;
    this.each(item => {
        if (isSpace) {
            output += item.toUpperCase();
        } else {
            output += item.toLowerCase();
        }
        isSpace = item == ' ';
    });
    return output.remove(item => item == ' ');
}
String.prototype.toSnakeCase = function () {
    let output = "";
    let isSpace = true;
    this.each(item => {
        if (isSpace) {
            output += item.toUpperCase();
        } else {
            output += item.toLowerCase();
        }
        isSpace = item == ' ';
    });
    output = output.remove(item => item == ' ');
    output = output.replace(output[0], output[0].toLowerCase());
    output = output.replace(/([A-Z])/g, "_$1");
    return output.toLowerCase();
}
String.prototype.toScreamingSnakeCase = function () {
    let output = "";
    let isSpace = true;
    this.each(item => {
        if (isSpace) {
            output += item.toUpperCase();
        } else {
            output += item.toLowerCase();
        }
        isSpace = item == ' ';
    });
    output = output.remove(item => item == ' ');
    output = output.replace(output[0], output[0].toLowerCase());
    output = output.replace(/([A-Z])/g, "_$1");
    return output.toUpperCase();
}
String.prototype.toCamelSnakeCase = function () {
    let output = "";
    let isSpace = true;
    this.each(item => {
        if (isSpace) {
            output += item.toUpperCase();
        } else {
            output += item.toLowerCase();
        }
        isSpace = item == ' ';
    });
    output = output.remove(item => item == ' ');
    output = output.replace(output[0], output[0].toLowerCase());
    output = output.replace(/([A-Z])/g, "_$1");
    return output;
}
String.prototype.toKebabCase = function () {
    let output = "";
    let isSpace = true;
    this.each(item => {
        if (isSpace) {
            output += item.toUpperCase();
        } else {
            output += item.toLowerCase();
        }
        isSpace = item == ' ';
    });
    output = output.remove(item => item == ' ');
    output = output.replace(output[0], output[0].toLowerCase());
    output = output.replace(/([A-Z])/g, "-$1");
    return output;
}
String.prototype.toScreamingKebabCase = function () {
    let output = "";
    let isSpace = true;
    this.each(item => {
        if (isSpace) {
            output += item.toUpperCase();
        } else {
            output += item.toLowerCase();
        }
        isSpace = item == ' ';
    });
    output = output.remove(item => item == ' ');
    output = output.replace(output[0], output[0].toLowerCase());
    output = output.replace(/([A-Z])/g, "-$1");
    return output.toUpperCase();
}
String.prototype.toCamelKebabCase = function () {
    let output = "";
    let isSpace = true;
    this.each(item => {
        if (isSpace) {
            output += item.toUpperCase();
        } else {
            output += item.toLowerCase();
        }
        isSpace = item == ' ';
    });
    output = output.remove(item => item == ' ');
    output = output.replace(output[0], output[0].toLowerCase());
    output = output.replace(/([A-Z])/g, "-$1");
    return output;
}
String.prototype.toBase64 = function () {
    return btoa(this);
}
String.prototype.fromBase64 = function () {
    return atob(this);
}
String.prototype.toBinary = function () {
    let output = "";
    this.each(item => {
        output += item.charCodeAt(0).toString(2).padLeft(8, '0');
    });
    return output;
}
String.prototype.fromBinary = function () {
    let output = "";
    let temp = "";
    let count = 0;
    this.each(item => {
        temp += item;
        count++;
        if (count == 8) {
            output += String.fromCharCode(parseInt(temp, 2));
            temp = "";
            count = 0;
        }
    });
    return output;
}
String.prototype.toJSON = function()  {
    return JSON.parse(this);
}
String.prototype.find = function(word = "")  {
    return this.indexOf(word);
}
;// CONCATENATED MODULE: ./node_modules/ckn.core/core/ckn.datetime.js

Date.prototype.date = function () {
    return ("0" + this.getDate()).slice(-2);
};
Date.prototype.month = function () {
    return ("0" + (this.getMonth() + 1)).slice(-2);
};
Date.prototype.year = function () {
    return this.getFullYear();
};
Date.prototype.hours = function () {
    return this.getHours();
};
Date.prototype.minutes = function () {
    return this.getMinutes();
};
Date.prototype.seconds = function () {
    return this.getSeconds();
};
Date.prototype.dataFormat = function () {
    return this.year() + "-" + this.month() + "-" + this.date();
}
// prints date in YYYY-MM-DD format
Date.prototype.dateDataFormat = function () {
    return this.year() + "-" + this.month() + "-" + this.date();
}
// prints time in HH:MM format
Date.prototype.timeDataFormat = function () {
    return this.hours().padStart(2, "0") + ":" + this.minutes().padStart(2, "0") + ":" + this.seconds().padStart(2, "0");
}
// prints date & time in YYYY-MM-DD HH:MM:SS format
Date.prototype.dateTimeDataFormat = function () {
    return this.dateDataFormat() + " " + this.timeDataFormat();
}
Date.prototype.addDays = function (days, day = null) {
    var date = null;
    if (day == null) date = new Date(this.valueOf());
    else date = new Date(day);
    date.setDate(date.getDate() + days);
    return date;
}
Date.prototype.addHours = function (h, day = null) {
    var date = null;
    if (day == null) date = new Date(this.valueOf());
    else date = new Date(day);
    date.setTime(date.getTime() + (h * 60 * 60 * 1000));
    return date;
}
;// CONCATENATED MODULE: ./node_modules/ckn.core/core/ckn.array.js
Array.prototype.print = function () {
    console.log(this.join(","));
    return this;
}
Array.prototype.clone = function () {
    return [...this];
}
Array.prototype.keys = function () {
    return Object.keys(this);
}
Array.prototype.same = function (array) {
    if (this.length != array.length) return false;
    let isSame = true;
    for (let i = 0; i < this.length; i++) {
        isSame = isSame && (array[i] == this[i]);
        if (!isSame) return false;
    }
    return isSame;
}
Array.prototype.values = function () {
    return Object.values(this);
}
Array.prototype.select = function (selectFunc) {
    let output = [];
    this.forEach(item => {
        output.push(selectFunc(item));
    });
    return output;
}
Array.prototype.union = function (list = null) {
    let output = [];
    if (list != null) {
        for (let item of this) {
            output.push(item);
        }
        for (let item of list) {
            output.push(item);
        }
    } else {
        for (let list of this) {
            for (let item of list) {
                output.push(item);
            }
        }
    }
    return output;
}
Array.prototype.intersect = function (list = null) {
    return this.filter(function(n) {
        return list.indexOf(n) !== -1;
    });
}
Array.prototype.where = function (condition) {
    return this.filter(condition);
}
Array.prototype.count = function (condition = null) {
    let output = 0;
    if (condition == null) {
        output = this.length;
    } else {
        output = this.filter(condition).length;
    }
    return output;
}
Array.prototype.toText = function (sp = ",", q = '') {
    let output = "";
    this.forEach(item => {
        output += q + item + q + sp;
    });
    if (sp.length > 0) {
        output = output.slice(0, -1 * sp.length);
    }
    return output;
}
Array.list = function (n, process = i => i, stepFunc = i => i + 1) {
    let output = [];
    for (let i = 0; i <= n; i = stepFunc(i)) {
        output.push(process(i));
    }
    return output;
}
Array.prototype.distinct = function (distinctFunc = null) {
    let output = [];
    this.forEach(item => {
        if (distinctFunc == null) {
            if (!output.includes(item)) {
                output.push(item);
            }
        } else {
            let exist = false;
            if (distinctFunc.length == 1) {
                exist = output.filter(a => distinctFunc(a) == distinctFunc(item)).length > 0;
            }
            else {
                exist = distinctFunc(item, output);
            }
            if (!exist) {
                output.push(item);
            }
        }
    });
    return output;
}
Array.prototype.first = function (n = 1) {
    if (n == 1) {
        return this[0];
    } else {
        let output = [];
        for (let i = 0; i < n; i++) {
            output.push(this[i]);
        }
        return output;
    }
}
Array.prototype.last = function () {
    return this[this.length - 1];
}
Array.concat = function (arr) {
    let output = [];
    this.forEach(item => {
        output.push(item);
    });
    arr.forEach(item => {
        output.push(item);
    });
    return output;
}
Array.prototype.repeat = function (n, isClone = false) {
    let output = [];
    for (let i = 0; i < n; i++) {
        this.forEach(item => {
            if (isClone) {
                output.push({...item});
            } else {
                output.push(item);
            }
        });
    }
    return output;
}
Array.prototype.group = function (...keys) {
    let key = keys[0];
    let output = {};
    for (let item of this.select(s => s[key]).distinct()) {
        output[item] = this.where(i => i[key] == item);
        if (keys.length > 1) {
            let newKeys = keys.slice(1,keys.length)
            output[item] = output[item].group(...newKeys);
        }
    }
    return output;
}
// Array Tools for Math
Array.prototype.max = function () {
    return Math.max(...this);
}
Array.prototype.min = function () {
    return Math.min(...this);
}
Array.prototype.sum = function (selectFnc = null) {
    let output = 0;
    this.forEach(item => {
        if (selectFnc == null)
            output += Number(item);
        else
            output += Number(selectFnc(item));
    });
    return output;
}
Array.prototype.avg = function () {
    let output = 0;
    this.forEach(item => {
        output += Number(item);
    });
    return output / this.length;
}
Array.prototype.abs = function () {
    return this.map(item => Math.abs(item));
}
Array.prototype.pow = function (n) {
    return this.map(item => Math.pow(item, n));
}
Array.prototype.sqrt = function () {
    return this.map(item => Math.sqrt(item));
}
Array.prototype.log = function (base = Math.E) {
    return this.map(item => Math.log(item, base));
}
Array.prototype.log10 = function () {
    return this.map(item => Math.log10(item));
}
Array.prototype.log2 = function () {
    return this.map(item => Math.log2(item));
}
Array.prototype.sin = function () {
    return this.map(item => Math.sin(item));
}
Array.prototype.cos = function () {
    return this.map(item => Math.cos(item));
}
Array.prototype.tan = function () {
    return this.map(item => Math.tan(item));
}
Array.prototype.asin = function () {
    return this.map(item => Math.asin(item));
}
Array.prototype.acos = function () {
    return this.map(item => Math.acos(item));
}
Array.prototype.atan = function () {
    return this.map(item => Math.atan(item));
}
Array.prototype.sinh = function () {
    return this.map(item => Math.sinh(item));
}
Array.prototype.cosh = function () {
    return this.map(item => Math.cosh(item));
}
Array.prototype.tanh = function () {
    return this.map(item => Math.tanh(item));
}
Array.prototype.asinh = function () {
    return this.map(item => Math.asinh(item));
}
Array.prototype.acosh = function () {
    return this.map(item => Math.acosh(item));
}
Array.prototype.atanh = function () {
    return this.map(item => Math.atanh(item));
}
Array.prototype.exp = function () {
    return this.map(item => Math.exp(item));
}
Array.prototype.exp2 = function () {
    return this.map(item => Math.pow(2, item));
}
Array.prototype.exp10 = function () {
    return this.map(item => Math.pow(10, item));
}
Array.prototype.floor = function () {
    return this.map(item => Math.floor(item));
}
Array.prototype.ceil = function () {
    return this.map(item => Math.ceil(item));
}
Array.prototype.round = function () {
    return this.map(item => Math.round(item));
}
Array.prototype.trunc = function () {
    return this.map(item => Math.trunc(item));
}
Array.prototype.clamp = function (min, max) {
    return this.map(item => Math.min(Math.max(item, min), max));
}
Array.prototype.random = function (min, max) {
    return this.map(item => Math.random() * (max - min) + min);
}
Array.prototype.randomInt = function (min, max) {
    return this.map(item => Math.floor(Math.random() * (max - min + 1)) + min);
}
Array.prototype.orderBy = function (compareFunc = null) {
    if (compareFunc == null) {
        return this.sort((a, b) => a - b);
    } 
    else {
        return this.sort((a, b) => compareFunc(a) - compareFunc(b));
    }
}
Array.prototype.orderByDesc = function (compareFunc = null) {
    if (compareFunc == null) {
        return this.sort((a, b) => b - a);
    } 
    else {
        return this.sort((a, b) => compareFunc(b) - compareFunc(a));
    }
}
Array.prototype.orderByAsc = function (compareFunc = null) {
    if (compareFunc == null) {
        return this.sort((a, b) => a - b);
    } 
    else {
        return this.sort((a, b) => compareFunc(a) - compareFunc(b));
    }
}
Array.prototype.orderByRandom = function () {
    return this.sort((a, b) => Math.random() - 0.5);
}
Array.prototype.orderByShuffle = function () {
    return this.sort((a, b) => Math.random() - 0.5);
}
Array.prototype.orderByIndex = function (index) {
    return this.sort((a, b) => a[index] - b[index]);
}
Array.prototype.orderByIndexDesc = function (index) {
    return this.sort((a, b) => b[index] - a[index]);
}
Array.prototype.orderByIndexAsc = function (index) {
    return this.sort((a, b) => a[index] - b[index]);
}
Array.prototype.orderByProperty = function (property) {
    return this.sort((a, b) => a[property] - b[property]);
}
Array.prototype.orderByPropertyDesc = function (property) {
    return this.sort((a, b) => b[property] - a[property]);
}
Array.prototype.orderByPropertyAsc = function (property) {
    return this.sort((a, b) => a[property] - b[property]);
}
Array.prototype.orderByLength = function () {
    return this.sort((a, b) => a.length - b.length);
}
Array.prototype.orderByLengthDesc = function () {
    return this.sort((a, b) => b.length - a.length);
}
Array.prototype.orderByLengthAsc = function () {
    return this.sort((a, b) => a.length - b.length);
}
Array.prototype.orderByText = function () {
    return this.sort((a, b) => a.localeCompare(b));
}
Array.prototype.orderByTextDesc = function () {
    return this.sort((a, b) => b.localeCompare(a));
}
Array.prototype.orderByTextAsc = function () {
    return this.sort((a, b) => a.localeCompare(b));
}
Array.prototype.unique = function (compareFunc) {
    let output = [];
    this.forEach(item => {
        if (compareFunc == null) {
            if (!output.includes(item)) {
                output.push(item);
            }
        } else {
            if (!compareFunc(item, output)) {
                output.push(item);
            }
        }
    });
    return output;
}
// Array tools for Boolean
Array.prototype.and = function() {
    let output = true;
    for (let item of this) {
        output = output && item;
    }
    return output;
}
Array.prototype.or = function() {
    let output = false;
    for (let item of this) {
        output = output || item;
    }
    return output;
}
Array.prototype.xor = function() {
    let output = false;
    for (let item of this) {
        output = output ^ item;
    }
    return output;
}
Array.prototype.not = function() {
    return this.map(item => !item);
}
Array.prototype.nand = function() {
    let output = true;
    for (let item of this) {
        output = output && !item;
    }
    return output;
}
Array.prototype.nor = function() {
    let output = false;
    for (let item of this) {
        output = output || !item;
    }
    return output;
}
Array.prototype.xnor = function() {
    let output = false;
    for (let item of this) {
        output = output ^ !item;
    }
    return output;
}

;// CONCATENATED MODULE: ./node_modules/ckn.core/ckn.js








class Ckn {
    #log = null;
    #api = null;

    get log() {
        if (this.#log == null) this.#log = new Log("CKN");
        return this.#log;
    }

    get api() {
        if (this.#api == null) this.#api = new Api();
        return this.#api;
    }

    getDistanceFromLatLngInKm(lat1, lon1, lat2, lon2) {
        function deg2rad(deg) {
            return deg * (Math.PI/180)
        }
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2-lat1);  // deg2rad below
        var dLon = deg2rad(lon2-lon1); 
        var a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        var d = R * c; // Distance in km
        return d;
    }
}

class CknErrorException extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.message = message;
    }
}
const ckn = new Ckn();
ckn.compressJSON = function (data) {
    let jsonString = JSON.stringify(data);
    let keys = [];
    function find(obj) {
        if (obj == null) return;
        if (typeof obj == "object" && !Array.isArray(obj)) {
            let _keys = Object.keys(obj);
            for (let key of _keys) {
                if (!keys.includes(key)) keys.push(key);
                find(obj[key]);
            }
        }
        else if (Array.isArray(obj)) {
            for (let item of obj) {
                find(item);
            }
        }
    }
    find(data);
    let indexKeys = {};
    let index = 0;
    for (let key of keys) {
        indexKeys[key] = '$' + index++ + "$";
        jsonString = jsonString.replaceAll(key, indexKeys[key]);
    }
    return {
        indexKeys: indexKeys,
        data: JSON.parse(jsonString)
    }
}
ckn.deCompressJSON = function (obj) {
    let indexKeys = obj.indexKeys;
    let data = obj.data;
    let jsonString = JSON.stringify(data);
    for (let key in indexKeys) {
        jsonString = jsonString.replaceAll(indexKeys[key], key);
    }
    return JSON.parse(jsonString);    
}
ckn.generateToken = (
    length = 64, 
    space = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890') => {
    var a = space.split("");
    var b = [];  
    for (var i=0; i<length; i++) {
        var j = (Math.random() * (a.length-1)).toFixed(0);
        b[i] = a[j];
    }
    return b.join("");
}


// EXTERNAL MODULE: ./node_modules/ckn.frontend/core/component.js
var component = __webpack_require__(563);
;// CONCATENATED MODULE: ./node_modules/ckn.frontend/ckn.frontend.js





;// CONCATENATED MODULE: ./apps/default.js



class Default extends component/* Component */.u {
    constructor() {
        super();
    }
    async onTemplateBuilding() {
        return /*html*/`<div>
        <div>`
    }
    async onInitializing() {
    }
    async onFinalizing() {
    }
}



;// CONCATENATED MODULE: ./apps/app.js



component/* Component */.u.register(Default);

component/* Component */.u.render(document.getElementById("main"));

})();

/******/ })()
;