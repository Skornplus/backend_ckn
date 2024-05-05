import {Controller} from "ckn.backend";

class DefaultController extends Controller {
    constructor() {
        super();
        this.url = "";
    }

    default = {
        url: "",
        process: async session => {
            let theme = session.loadTheme("default", "default");
            theme.views.push("main.default.ejs");
            await theme.render(session);
        }
    }

}

export {DefaultController}