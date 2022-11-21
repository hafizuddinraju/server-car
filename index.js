const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const cors = require('cors')
const teams = require('./data/teams.json')
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
app.use(cors())
app.use(express.json())
require('dotenv').config()


const uri = `mongodb+srv://${process.env.CAR_USER}:${process.env.CAR_KEY}@cluster0.cvtbcrw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

const verifytoken = (req, res, next)=>{
    const authHeader = req.headers.authorization;
        if(!authHeader){
            return res.status(401).send({
                message: 'unauthorized access',
            })
        }
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded){
            if(err){
                return res.status(403).send({
                    message: 'Forbidden access',
                })

            }
            req.decoded = decoded;
            next();
        })

}

async function dbConnect(){
    try{
        await client.connect();
        console.log('Database Connected')


    }catch (error){
        console.log(error);

    }
}
dbConnect()
const allOrder = client.db('car-website').collection('orders')
const allServices = client.db('car-website').collection('services')

app.get('/teams',(req, res)=>{
    try{
        res.send({
            success:true,
            message:"Got data",
            data: teams
        })

    }
    catch(error){
        res.send({
            success:false,
            error: error.message
        })
    }
})

app.get('/services', async(req, res)=>{
    try{
        const cursor = allServices.find({})
        const services = await cursor.toArray()

        res.send({
            success:true,
            message:'Successfully Got Data',
            data: services
        })

    }catch(error){
        res.send({
            success: false,
            error:error.message
        })
    }
    
})
app.get('/services/:id',async(req, res)=>{
    try{
        const {id} = req.params
        const service = await allServices.findOne({_id:ObjectId(id)})
        
        res.send({
            success:true,
            message:'Successfully Got Data',
            data:service
        })

    }catch(error){
        res.send({

            success:false,
            error:error.message
        })

    }
})
app.post('/orders',async(req,res)=>{
    try{
        const result = await allOrder.insertOne(req.body);
        if(result.insertedId){
            res.send({
                success:true,
                message:'Successfully Added Order'
            })
        }

    }catch(error){
        res.send({
            success:false,
            error:error.message
        })
    }
})
app.get('/orders',verifytoken,async(req, res)=>{
    try{
        const decoded = req.decoded;
        
        
        const cursor = allOrder.find({})
        const orders = await cursor.toArray()

        const findEmail = orders.find(order => order.email === decoded.email)
        console.log(findEmail);
        if(!findEmail){
            console.log('not find')
            res.status(403).send({
                            message:'unauthoried access'
                        })

        }
        

        res.send({
            success:true,
            message:'Successfully Got Data',
            data: orders
        })

    }catch(error){
        res.send({
            success:false,
            error:error.message
        })
    }
})

app.delete('/orders/:id',async(req, res)=>{
    const {id} = req.params;
    try{
        const query = ({_id:ObjectId(id)})
        const result = await allOrder.deleteOne(query)
        if(result.deletedCount){
            res.send({
                success:true,
                message:'Order Successfully Deleted'
            })
        }

    }catch (error){
        res.send({
            success:false,
            error:error.message
        })

    }
})

app.patch('/orders/:id',async(req, res)=>{
    try{
        const {id} = req.params
        const status = req.body.status
        const query = {_id:ObjectId(id)}
        const updateDoc = {
            $set:{
                status:status
            }
        }
        const result = await allOrder.updateOne(query, updateDoc);
        if(result.modifiedCount){
            res.send({
                success:true,
                message:'Update Complete'
            })
        }

    }catch(error){
        res.send({
            success:false,
            error:error.message
        })
    }
})
app.post('/jwt', (req, res)=>{
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN, {expiresIn: '10d'})
    res.send({
        success:true,
        token:token
    })
})

app.listen(port, ()=>{
    console.log(`Server is running ${port}`)
})

//require('crypto').randomBytes(64).toString('hex')