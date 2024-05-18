import {ckn} from "ckn.core";
import {Component} from "ckn.frontend";

class Default extends Component {
    constructor() {
        super();
    }
    async onTemplateBuilding() {
        return /*html*/`<div>

        Hello Backend
        <div>`
    }
    async onInitializing() {
    }
    async onFinalizing() {
    }
}

export {Default}
