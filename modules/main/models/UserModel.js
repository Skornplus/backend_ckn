import {Model} from "ckn.backend";
import { MongoDBModel } from "../helper/MongoDBModel.js";

class UserModel extends Model {
    
    
    async  getUser(username){
      let db = new MongoDBModel();
      let user = await db.query('user_data','username',username);
      return user ?? {status_code:404,message : 'user not found'};
    }

    async test(){   
        let db = new MongoDBModel();
          
          try {
           // await db.test();
            let res = await db.query('user_data','username','testkup');
            console.log(res);
            return res ??  {status_code:404,message : 'Data not found'};
          } finally {
            // Ensures that the client will close when you finish/error
         
          }

        }
        async scoreUpdate(data){   
          console.log(data);
          if(!data.username || !data.score){
            return {status_code:400,message : 'Data Incorrect'};
          }

          let db = new MongoDBModel();

          let user = await db.query('user_data','username',data.username);
          console.log("user",user);
          if(user == null ) {
            return {status_code:404,message : 'User Not Found'};
          }
            try {
              let updatedata = {
                username:data.username,
                score:data.score,
                timestamp: new Date().dateTimeDataFormat()
              }
              let res = await db.insert('user_score',updatedata);
              console.log(res);
              return  {status_code:201,message : 'Data Updated'};;
            } finally {
              // Ensures that the client will close when you finish/error
           
            }
  
          }

          async userDataUpdate(data){   
            console.log(data);
            // if(!data.username || !data.password){
            //   return {status_code:400,message : 'Data Incorrect'};
            // }
  
            let db = new MongoDBModel();
  
            let user = await db.query('user_data','username',data.username);
            console.log("user",user);
            if(user == null ) {
              return {status_code:404,message : 'User Not Found'};
            }
              try {
                let updateData = {
                  username:data.username,
                  firstname:data.firstname,
                  lastname:data.lastname,
                  password:data.password
                }
                let filter = { "username" : data.username}
                let res = await db.update2('user_data',updateData,filter);
                console.log(res);
                return  {status_code:201,message : 'Data Updated'};;
              } finally {
                // Ensures that the client will close when you finish/error
             
              }
    
            }
}

export {UserModel}