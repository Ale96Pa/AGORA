import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import NavigationBar from './NavigationBar.js';
import SideBar from './SideBar.js';
import ProcessAnalysis from './ProcessAnalysis.js';
import { useState } from 'react';

// Point Eel web socket to the instance
export const eel = window.eel
eel.set_host('ws://localhost:8080')

// Expose the `sayHelloJS` function to Python as `say_hello_js`
function sayHelloJS(x: any) {
  console.log('Hello from ' + x)
}
// WARN: must use window.eel to keep parse-able eel.expose{...}
window.eel.expose(sayHelloJS, 'say_hello_js')

// Test anonymous function when minimized. See https://github.com/samuelhwilliams/Eel/issues/363
function show_log(msg: string) {
  console.log(msg)
}
window.eel.expose(show_log, 'show_log')

// Test calling sayHelloJS, then call the corresponding Python function
sayHelloJS('Javascript World!')
eel.say_hello_py('Javascript World!')

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const refreshSecurityControls = () => {
    setRefreshTrigger(!refreshTrigger);
  };

  const handleSelectionChange = () => {
    setRefreshTrigger(prev => !prev);
    console.log("here too");
  }
  return (
    <>
      <div className="div">
        <NavigationBar onSelectionChange={handleSelectionChange} refreshTrigger={refreshTrigger} />
        <div className="div-34">
          <div className="div-35">
            <SideBar refreshTrigger={refreshTrigger} refreshControls={refreshSecurityControls} />
            <ProcessAnalysis analysisTrigger={refreshTrigger}/>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
