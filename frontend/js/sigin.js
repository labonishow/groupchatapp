async function handleSignInForm(event) {
    event.preventDefault();

    const email = event.target.email.value;
    const password = event.target.password.value;

    const signinObj = {
        email,
        password
    };

    console.log(signinObj);

    try {
        const response = await axios.post(
            "http://localhost:5000/api/signin",
            signinObj
        );

        console.log(response.data);

        localStorage.setItem("token", response.data.token);

        alert(response.data.message);

    } catch (error) {

        if (error.response) {
            alert(error.response.data.message);
        } else {
            alert("Server is not running");
        }
    }
}