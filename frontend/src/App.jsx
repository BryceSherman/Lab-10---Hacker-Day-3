import { useAuthContext } from "@asgardeo/auth-react";
import Header from "./components/Header";
import Body from "./components/Body";
import Footer from "./components/Footer";
import "./App.css";

function App() {
  const { state, signIn, signOut } = useAuthContext();

  return (
    <div className="app-container">
      <Header />

      {!state?.isAuthenticated ? (
        <main className="body">
          <h2>Please sign in to manage your puppies</h2>
          <button type="button" onClick={() => signIn()}>
            Sign In
          </button>
        </main>
      ) : (
        <>
          <div className="auth-bar">
            <button type="button" onClick={() => signOut()}>
              Sign Out
            </button>
          </div>
          <Body />
        </>
      )}

      <Footer />
    </div>
  );
}

export default App;