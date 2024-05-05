import { MongoClient, ServerApiVersion } from 'mongodb';
export class MongoDBModel {

    constructor() {
        const uri = "mongodb+srv://skorn:skorn1234@cluster0.hqsfwbf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

        this.client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });
        this.db = this.client.db("data");
    }

    async test() {
        try {
            await this.client.connect();
            // Send a ping to confirm a successful connection
            await this.client.db("data").command({ ping: 1 });
            console.log("Pinged your deployment. You successfully connected to MongoDB!");
        } finally {
            // Ensures that the client will close when you finish/error
            await this.client.close();
        }
    }

    async query(collectionName, key, value) {
        console.log(collectionName,'Querying',key,value);
        await this.client.connect();
        const query = {};
        query[key] = value;

        const collection = this.db.collection(collectionName);
        let res = await collection.findOne(query, function (err, result) {
            if (err) {
                console.error('Error occurred while finding document', err);
                return;
            }

            console.log('Found document:', result);
            return result;
        });
        await this.client.close();
        return res;
    }

    async insert(collectionName,insData){
        console.log(collectionName,'Inserting',insData);
        let res = null
        try{
           await this.client.connect();
            const collection = this.db.collection(collectionName);
             res = collection.insertOne(insData, function(err, result) {
                if (err) {
                  console.error('Error occurred while inserting document', err);
                  return {is_success: false,message:err}
                }else{
                    return {is_success: true,data:result.insertedId}
                }
      
              });
        }finally{
           // await this.client.close();
        }
  
      
        return res;
    }

    // async update(collectionName,updateData,filter){
    //     console.log(collectionName,'Updating',updateData,filter);
    //     await this.client.connect();
    //     const collection = this.db.collection(collectionName);

    //     const updateOperation = { $set: {} };
    //     for(const key in updateData){
    //         if (Object.hasOwnProperty.call(updateData, key)) {
    //             updateOperation.$set[key] = updateData[key];
    //           }
    //     }
    //     console.log(updateOperation)
    //     collection.updateOne(filter, updateData, function(err, result) {
    //         if (err) {
    //           console.error('Error occurred while updating document', err);
    //           return {is_success: false};
    //         }else{
                            
    //         console.log('Document updated successfully');
    //             return {is_success: true}
    //         }

    //       });
    // }

    async update(collectionName, updateData, filter) {
        console.log(collectionName, 'Updating', updateData, filter);
        try {
            await this.client.connect();
            const collection = this.db.collection(collectionName);
    
            const updateOperation = { $set: {} };
            for (const key in updateData) {
                if (Object.hasOwnProperty.call(updateData, key)) {
                    updateOperation.$set[key] = updateData[key];
                }
            }
            console.log(updateOperation);
    
            const result = await collection.updateOne(filter, updateOperation);
            console.log('Document updated successfully');
            return { is_success: true };
        } catch (err) {
            console.error('Error occurred while updating document', err);
            return { is_success: false };
        }
    }
    

}