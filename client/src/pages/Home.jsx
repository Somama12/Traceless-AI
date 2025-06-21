import GmailConnectButton from "../components/GmailConnectionButton";

const Home = () => {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">
          📩 TraceLess
        </h1>
        <p className="text-gray-600 text-lg mb-10 text-center max-w-md">
          Find out what accounts your inbox is connected to — without reading a single email.
        </p>
        <p>
            <GmailConnectButton/>
        </p>
      </div>
    )
  }
  
  export default Home;
  