import express from 'express'
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcrypt';
import {Admin, Cart, Orders, Product, User } from './Schema.js'

const app = express();

app.use(express.json());
app.use(bodyParser.json({limit: "30mb", extended: true}))
app.use(bodyParser.urlencoded({limit: "30mb", extended: true}));
app.use(cors());

const PORT = 5000;

// ✅ Root API
app.get('/', (req, res) => {
    res.send("ShopEZ Backend Running Successfully 🚀");
});

mongoose.connect('mongodb://localhost:27017/shopez_app',{
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(()=>{

    console.log("MongoDB Connected");

// ================= REGISTER =================
    app.post('/register', async (req, res) => {
        console.log("Register API called");

        const { username, email, usertype, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        try {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = new User({
                username, email, usertype, password: hashedPassword
            });

            const userCreated = await newUser.save();
            return res.status(201).json(userCreated);

        } catch (error) {
          console.log(error);
          return res.status(500).json({ message: 'Internal Server Error' });
        }
    });

// ================= LOGIN =================
    app.post('/login', async (req, res) => {
        console.log("Login API called");

        const { email, password } = req.body;

        try {
            const user = await User.findOne({ email });
    
            if (!user) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid email or password' });
            } else{
                return res.json({ message: "Login successful", user });
            }
          
        } catch (error) {
          console.log(error);
          return res.status(500).json({ message: 'Internal Server Error' });
        }
    });

// ================= FETCH BANNER =================
    app.get('/fetch-banner', async(req, res)=>{
        try{
            const admin = await Admin.findOne();
            res.json(admin?.banner);
        }catch(err){
            res.status(500).json({ message: 'Internal Server Error' });
        }
    })

// ================= FETCH USERS =================
    app.get('/fetch-users', async(req, res)=>{
        try{
            const users = await User.find();
            res.json(users);
        }catch(err){
            res.status(500).json({ message: 'Internal Server Error' });
        }
    })

// ================= FETCH PRODUCT DETAILS =================
    app.get('/fetch-product-details/:id', async(req, res)=>{
        try{
            const product = await Product.findById(req.params.id);
            res.json(product);
        }catch(err){
            res.status(500).json({message: "Internal Server Error"});
        }
    })

// ================= FETCH PRODUCTS =================
    app.get('/fetch-products', async(req, res)=>{
        try{
            const products = await Product.find();
            res.json(products);
        }catch(err){
            res.status(500).json({ message: 'Internal Server Error' });
        }
    })

// ================= FETCH ORDERS =================
    app.get('/fetch-orders', async(req, res)=>{
        try{
            const orders = await Orders.find();
            res.json(orders);
        }catch(err){
            res.status(500).json({ message: 'Internal Server Error' });
        }
    })

// ================= FETCH CATEGORIES =================
    app.get('/fetch-categories', async(req, res)=>{
        try{
            const data = await Admin.find();
            if(data.length===0){
                const newData = new Admin({banner: "", categories: []})
                await newData.save();
                return res.json([]);
            }else{
                return res.json(data[0].categories);
            }
        }catch(err){
            res.status(500).json({message: "Internal Server Error"});
        }
    })

// ================= ADD PRODUCT =================
    app.post('/add-new-product', async(req, res)=>{
        const {productName, productDescription, productMainImg, productCarousel, productSizes, productGender, productCategory, productNewCategory, productPrice, productDiscount} = req.body;
        try{
            if(productCategory === 'new category'){
                const admin = await Admin.findOne();
                admin.categories.push(productNewCategory);
                await admin.save();

                const newProduct = new Product({
                    title: productName,
                    description: productDescription,
                    mainImg: productMainImg,
                    carousel: productCarousel,
                    category: productNewCategory,
                    sizes: productSizes,
                    gender: productGender,
                    price: productPrice,
                    discount: productDiscount
                });

                await newProduct.save();
            } else{
                const newProduct = new Product({
                    title: productName,
                    description: productDescription,
                    mainImg: productMainImg,
                    carousel: productCarousel,
                    category: productCategory,
                    sizes: productSizes,
                    gender: productGender,
                    price: productPrice,
                    discount: productDiscount
                });

                await newProduct.save();
            }
            res.json({message: "Product added successfully"});
        }catch(err){
            res.status(500).json({message: "Internal Server Error"});
        }
    })

// ================= PLACE CART ORDER =================
    app.post('/place-cart-order', async(req, res)=>{
        const {userId, name, mobile, email, address, pincode, paymentMethod, orderDate} = req.body;
        try{
            const cartItems = await Cart.find({userId});

            for (const item of cartItems) {
                const newOrder = new Orders({
                    userId, name, email, mobile, address, pincode,
                    title: item.title,
                    description: item.description,
                    mainImg: item.mainImg,
                    size:item.size,
                    quantity: item.quantity,
                    price: item.price,
                    discount: item.discount,
                    paymentMethod,
                    orderDate
                });

                await newOrder.save();
                await Cart.deleteOne({_id: item._id});
            }

            res.json({message: 'Order placed'});
        }catch(err){
            res.status(500).json({message: "Internal Server Error"});
        }
    })

// ================= SERVER =================
    app.listen(PORT, ()=>{
        console.log(`Server running on port ${PORT}`);
    })

}).catch((e)=> console.log(`Error in db connection ${e}`));