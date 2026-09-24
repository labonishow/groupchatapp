function handleSignInForm(event){
    event.preventDefault();
    const email = event.target.email.value; 
    const password = event.target.password.value;
    
    const signupobj = {email,password};
    console.log(signupobj);
}