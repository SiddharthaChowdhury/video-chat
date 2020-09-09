import React from 'react';
import {BrowserRouter, Route, Switch} from "react-router-dom";
import {CreateRoom} from "./routes/CreateRoom";
import {Room} from "./routes/Room";
import './App.scss';
import { UtilSocket } from './util/utilSocket';
import { IdSocketKey } from './util/IdSocketKey';

export const UserContext = React.createContext({});
export const $io = new UtilSocket();

const App: React.FC<any> = () => {
	const [user, setUserId] = React.useState<object>({})
	React.useEffect(() => {
		const uid = window.prompt('Enter uiserId')
		const name = window.prompt('Enter name');

		const userInfo = {
			id: uid || + new Date(),
			name: name || 'Unanamed'
		};

		setUserId(userInfo)

		$io.socket.emit(IdSocketKey.login, userInfo);
	}, [])

	return (
		<UserContext.Provider value={user}>
			<BrowserRouter>
				<Switch>
					<Route path={'/'} exact component={CreateRoom}/>
					<Route path={'/room/:roomId'} component={Room}/>
				</Switch>
			</BrowserRouter>
		</UserContext.Provider>
	);
}

export default App;
