import React from "react";

/*
 *  When create room btn is clicked, user will be redirected to 
 *  a new tab, and user-A can take the URL and share with user-B
 */
export const CreateRoom: React.FC<any> = (props) => {
    function create() {
        const id = + new Date();
        props.history.push(`/room/${id}`);
    }
    return(
        <button onClick={create}>Create room</button>
    )
}