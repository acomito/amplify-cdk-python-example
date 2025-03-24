import { Amplify } from "aws-amplify";

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const userPoolWebClientId = import.meta.env.VITE_COGNITO_CLIENT_ID;

console.log(import.meta.env);

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId,
      userPoolClientId: userPoolWebClientId,
      signUpVerificationMethod: "code",
      loginWith: {
        email: true,
      },
    },
  },
});
