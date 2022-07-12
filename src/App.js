import logo from './logo.svg';
import React from 'react';

import Header from './components/header/Header'
import Navbar from './components/navbar/Navbar'
import Dashboard from './components/pages/dashboard/Dashboard'
import Home from './components/pages/home/Home'
import UserList from './components/pages/userList/UserList'
import User from './components/pages/user/User'
import NewUser from './components/pages/newUser/NewUser'
import WebSocket from './components/socket/WebSocket'
import TwinManage from './components/pages/twinManage/TwinManage'
import PolicyManage from './components/pages/policyManage/PolicyManage'
import PolicySetting from './components/pages/policyManage/PolicySetting'
import PolicyStatus from './components/pages/policyManage/PolicyStatus'
import { UsersProvider } from './UsersContext';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

//const PolicySetting = React.lazy(() => import('./components/pages/policyManage/PolicySetting'));


function App() {

  return (
    <UsersProvider>
      <WebSocket />
      <Router>
        <div className="App">
          <Header />
          <div className='container'>
            <Navbar />
            <Routes>
              <Route exact path="/" element={<Dashboard />} />
              <Route path="/policyManage" element={<PolicyManage />} />
              <Route path="/policyManage/:policyId" element={<PolicySetting />} />
              <Route path="/policyStatus/:policyId" element={<PolicyStatus />} />

              <Route path="/twinManage" element={<TwinManage />} />
              <Route path="/home" element={<Home />} />
              <Route path="/UserList" element={<UserList />} />
              <Route path="/user/:userId" element={<User />} />
              <Route path="/newUser" element={<NewUser />} />
            </Routes>
          </div>
        </div>
      </Router>
    </UsersProvider>

  );
}

export default App;
