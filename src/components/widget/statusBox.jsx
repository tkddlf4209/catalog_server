import React from 'react';
import styled from 'styled-components';

const Container = styled.div`        
    padding: 25px;
    background-color: #202026;
    margin-left:8px;
    cursor: pointer;
    -webkit-box-shadow: 2px 2px 5px 1px #202026;
    box-shadow: 1px 1px 3px 1px #202026;
    display:flex;
    flex:1;
    border-radius: 10px;
    flex-direction: column;
`;

const Title = styled.span`
    font-size: 18px;
    font-weight: 400;
    margin-right:15px;
`;

export default function StatusBox({status}){
    return ( 
         <Container>
                <Title>{status.title}</Title>
                <h2 style={status.style?status.style:{}}>{status.content}</h2>
        </Container>
    )
}