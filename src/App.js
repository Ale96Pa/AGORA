import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import NavigationBar from './NavigationBar.js';
import SideBar from './SideBar.js';
import ProcessAnalysis from './ProcessAnalysis.js';
import Reporting from './Reporting.js';  // Import the new Reporting component
import { useState } from 'react';

// Point Eel web socket to the instance
export const eel = window.eel;
eel.set_host('ws://localhost:8080');

// Expose the `sayHelloJS` function to Python as `say_hello_js`
function sayHelloJS(x) {
  console.log('Hello from ' + x);
}
// WARN: must use window.eel to keep parse-able eel.expose{...}
window.eel.expose(sayHelloJS, 'say_hello_js');

// Test anonymous function when minimized. See https://github.com/samuelhwilliams/Eel/issues/363
function show_log(msg) {
  console.log(msg);
}
window.eel.expose(show_log, 'show_log');

// Test calling sayHelloJS, then call the corresponding Python function
sayHelloJS('Javascript World!');
eel.say_hello_py('Javascript World!');

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [showProcessAnalysis, setShowProcessAnalysis] = useState(true);  // State to control visibility of ProcessAnalysis

  const refreshSecurityControls = () => {
    setRefreshTrigger(!refreshTrigger);
  };

  const handleSelectionChange = () => {
    setRefreshTrigger(prev => !prev);
    console.log("here too");
  };

  // Function to toggle between ProcessAnalysis and Reporting views
  const toggleView = () => {
    setShowProcessAnalysis(prevState => !prevState);  // Toggle between true and false
  };

  return (
    <>
      <div className="div">
        <NavigationBar onSelectionChange={handleSelectionChange} refreshTrigger={refreshTrigger} toggleView={toggleView} />
        <div className="div-34">
          <div className="div-35">
            <SideBar refreshTrigger={refreshTrigger} refreshControls={refreshSecurityControls} />
            {/* Conditionally render ProcessAnalysis or Reporting based on the showProcessAnalysis state */}
            {showProcessAnalysis ? (
              <ProcessAnalysis analysisTrigger={refreshTrigger} />
            ) : (
              <Reporting />  // Render Reporting component when showProcessAnalysis is false
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
