const createMessage = ({user,text})=>{
    if(!text){
        throw new Error("Message text is required");
    }
    return{
        text,
        senderId:user.id,
        User:{id:user.id,name:user.name},
        createdAt: new Date().toISOString()
    };
};

module.exports={createMessage}