import React from 'react';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import styled from 'styled-components';
const Container = styled.div`                                                                                                                                                                                                                                                                                                                                                                                      
    margin : 8px;
    padding: 15px;
    background-color: #202026;
    border-radius: 7px;
    cursor: pointer;
    -webkit-box-shadow: 2px 2px 5px 1px #202026;
    box-shadow: 1px 1px 3px 1px #202026;
`;

const Title = styled.span`
    font-size: 20px;
`;

const ItemContainer = styled.div`
    margin: 4px 0;
    display: flex;
    align-items: center;
`

const SubTitle = styled.span`
    font-size: 12px;
    color: grey;
`
const Money = styled.span`
    font-size: 30px;
    font-weight: 600;
`;
const MoneyRate = styled.span`
    display: flex;
    align-items: center;
    margin-left: 20px;
`;

export default function statusBox(){
    return (
        <Container>
                <Title>Revenue</Title>
                <ItemContainer>
                    <Money>
                        $2,456
                        </Money>
                    <MoneyRate>
                        -11.4 <ArrowDownwardIcon/> {/*  className='infoIcon positive' */}
                    </MoneyRate>
                 
                </ItemContainer>
                <SubTitle>
                    Comapred to last month
                </SubTitle>
               
        </Container>
                
       
           
    )
}