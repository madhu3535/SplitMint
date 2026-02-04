import User from "../models/user.js"


export const addImg = async(req,res)=>{
    const {url} = req.body
    const userId = req.params.userId
    console.log(userId,url)
    try{
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: { image: url } },
            { new: true }
        );
        res.status(200).json({ message: 'image added successfully', user });

    }catch(err){
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

