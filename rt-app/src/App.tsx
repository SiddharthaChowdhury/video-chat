import React from 'react';
import {BrowserRouter, Route, Switch} from "react-router-dom";
import {CreateRoom} from "./routes/CreateRoom";
import {Room} from "./routes/Room";
import './App.scss';

const App: React.FC<any> = () => {
	return (
		<div>
			<BrowserRouter>
				<Switch>
					<Route path={'/'} exact component={CreateRoom}/>
					<Route path={'/room/:roomId'} component={Room}/>
				</Switch>
			</BrowserRouter>
		</div>
	);
}

export default App;
