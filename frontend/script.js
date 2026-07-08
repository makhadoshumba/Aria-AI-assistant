const sendButton =
document.getElementById("send");


const input =
document.getElementById("message");


sendButton.onclick = function(){

    let message = input.value;


    if(message.trim()==""){
        return;
    }


    console.log(
        "User message:",
        message
    );


    input.value="";

};