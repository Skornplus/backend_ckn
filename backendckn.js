import {Backend} from "ckn.backend";
import {StaticContentMiddleware} from "ckn.backend";
import {FrontendMiddleware} from "ckn.backend";
import {PageViewEngineMiddleware} from "ckn.backend";
import {ModuleMiddleware} from "ckn.backend";
import {EjsViewEngineMiddleware} from "ckn.backend";
import {CknHtmlViewEngineMiddleware} from "ckn.backend";
import {ThemeMiddleware} from "ckn.backend";
import {EnvironmentVariableMiddleware} from "ckn.backend";

let backend = new Backend();
backend.use(new StaticContentMiddleware().addPublicFolder('/client', 'client'));
backend.use(new FrontendMiddleware());
backend.use(new PageViewEngineMiddleware());
backend.use(new ModuleMiddleware());
backend.use(new EjsViewEngineMiddleware());
backend.use(new CknHtmlViewEngineMiddleware());
backend.use(new ThemeMiddleware());
backend.use(new EnvironmentVariableMiddleware());

await backend.start();

