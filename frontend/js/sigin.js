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

        const token = response.data.token;
        localStorage.setItem("chattoken", token);

        alert(response.data.message);

        if (token) {
            window.location.href = "chat.html";
        }

    } catch (error) {

        if (error.response) {
            alert(error.response.data.message);
        } else {
            alert("Server is not running");
        }
    }
}