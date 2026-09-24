async function handleSignUpForm(event) {
  event.preventDefault();

  const name = event.target.name.value;
  const email = event.target.email.value;
  const phone = event.target.phone.value;
  const password = event.target.password.value;

  const signupObj = {
    name,
    email,
    phone,
    password,
  };

  try {
    const response = await axios.post(
      "http://localhost:5000/api/signup",
      signupObj,
    );

    console.log(response.data);

    alert(response.data.message);
    window.location.href = "signin.html";
  } catch (error) {
    console.error(error);
  }
}
