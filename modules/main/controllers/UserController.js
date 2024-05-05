import {Controller} from "ckn.backend";
import { UserModel } from "../models/UserModel.js";

class UserController extends Controller {
    constructor() {
        super();
        this.url = "User";
    }

    default = {
        url: "",
        process: async session => {
            let theme = session.loadTheme("default", "default");
            theme.views.push("main.user.ejs");
            await theme.render(session);
        }
    }

    getUserData = {
        process: async session => {
            let model = new UserModel();
            let username = session.request.query.username;
            let result = await model.getUser(username);
            session.send(result)
        }
    }

    test = {
        url: "test",
        process: async session => {
            let model = new UserModel();
            let test2=  await   model.test();
            session.send(test2)
        }
    }

    scoreUpdate = {
        method: Controller.Method.POST,
        process: async session => {
            let model = new UserModel();
            let request = session.request.body;

            let test2=  await   model.scoreUpdate(request);
            session.send(test2)
        }
    }

    userDataUpdate = {
        method: Controller.Method.POST,
        process: async session => {
            let model = new UserModel();
            let request = session.request.body;

            let test2=  await   model.userDataUpdate(request);
            session.send(test2)
        }
    }


}

export {UserController}