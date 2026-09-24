function handleSignUpForm(event){
    event.preventDefault();
    const name = event.target.name.value; 
    const email = event.target.email.value; 
    const phone = event.target.phone.value; 
    const password = event.target.password.value;
    
    const signupobj = {name,email,phone,password};
    console.log(signupobj);
}