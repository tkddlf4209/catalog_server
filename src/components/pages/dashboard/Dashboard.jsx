import React , {useState, useEffect,useMemo , useCallback,useRef}from 'react'
import { ForceGraph2D  } from 'react-force-graph';
import "./dashboard.scss"
import {DataGrid} from '@mui/x-data-grid'
import {
    CSS2DRenderer,
    CSS2DObject
} from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { useUsersState, useUsersDispatch, API , getEntity} from '../../../UsersContext';
import { MpRounded } from '@mui/icons-material';
import DeleteOutline from '@mui/icons-material/DeleteOutline';

import DashboardJsonEntityView from './DashboardJsonEntityView';
import DashboardJsonTwinView from './DashboardJsonTwinView';
import StatusBox from '../../widget/statusBox';

const twin_columns = [
    { field: "id", headerName: "Twin ID", width: 150 },
    { field: "name", headerName: "Twin Name", width: 150},
    { field: "status", headerName: "Status", width: 100,
    renderCell : (params) =>{
        return (
            <>
                <p style={params.row.status==="connect"?{color:"green"}:{color:"red"}}>{params.row.status}</p>
            </>
        )
    }},
    { field: "action", headerName: "Action", width: 100 ,
    renderCell : (params) =>{
        return (
            <>
                <DeleteOutline  onClick={()=>API.removeTwin({
                    data :params.row
                })}/> 
            </>
        )
    } }
    
];

const entity_colums = [
    { field: "id", headerName: "Entity ID", width: 150 },
    { field: "name", headerName: "Entity Name", width: 150}
];

const log_columns = [
    { field: "id", headerName: "Id", width: 150 },
    { field: "timestamp", headerName: "Time", width: 150 },
    { field: "type", headerName: "type", width: 150 },
    { field: "data", headerName: "data",  flex: 1,// minWidth: 100
    renderCell : (params) =>{
        return (
            <>
                <p >{JSON.stringify(params.row.data)}</p>
            </>
        )
    }}
];

export default React.memo(function Dashboard(){

    const fgRef = useRef(); // chart reference
    const extraRenderers = [new CSS2DRenderer()];
    const [labelShow, setLabelShow] = useState(true);
    const [latestSelectId, setLatestSelectId] = useState({id:"",type:""}); // twin, entity 중 마지막 선택된 아이디
    const [twinSelectId, setTwinSelectId] = useState("SERVER"); // twin, entity 중 마지막 선택된 아이디

    const state = useUsersState();
    const dispatch = useUsersDispatch();
    const { twin_infos ,event_logs} = state; 
    
    // const getSingleTwinInfo = useMemo(()  =>{
    //     return twin_infos[selectTwinId];
        
    // },[twin_infos,selectTwinId]);

    // const getSingleEntityInfo = useMemo(()  =>{
    //     return entity;
    // },entity);

    const nodeFocusHandler = useCallback((node)=>{

        const distance = 100;
        const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

        const newPos = node.x || node.y || node.z
            ? { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }
            : { x: 0, y: 0, z: distance }; // special case if node is in (0,0,0)

        // fgRef.current.cameraPosition(
        //     newPos, // new position
        //     node, // lookAt ({ x, y, z })
        //     2000  // ms transition duration
        // );

        fgRef.current.zoom(3.5, 400);
        fgRef.current.centerAt(node.x, node.y, 400);
        setLatestSelectId(
            {
                id:node.id,
                type:node.type
            }
        );
    })

    const nodeFocusTableHandler = useCallback((row,type)=>{

        // useMemo를 통해서 재활용된 값이 넘어오기때문에 좌표 값이 담겨있음
        var node = getNodeDatas.nodes.find(function(node) {
            return node.id == row.id;
        });

        if(node){
            const distance = 100;
            const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

            const newPos = node.x || node.y || node.z
                ? { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }
                : { x: 0, y: 0, z: distance }; // special case if node is in (0,0,0)

            // fgRef.current.cameraPosition(
            //     newPos, // new position
            //     node, // lookAt ({ x, y, z })
            //     2000  // ms transition duration
            // );

            fgRef.current.zoom(3.5, 400);
            fgRef.current.centerAt(node.x, node.y, 400);
        }

        setLatestSelectId(
            {
                id:row.id,
                type:type
            }
        );

        
    })

    // const fetchData = () => {
    //     getTwins(dispatch);
    // };

    //console.log(state);
    const getNodeDatas = useMemo(()  =>{
        
        var nodes = [];
        var links = [];

        nodes.push({ id: "SERVER", name: "카탈로그 서버" , type : 0})
        for (const [id, twin] of Object.entries(twin_infos)) {
            nodes.push({id : twin.id ,name : twin.name, type : 1 , status: twin.status});
            links.push({source: twin.id, target: "SERVER",value : twin.status==='connect'?1:0});

            twin.entities?.forEach(entity=>{
                if(entity.enable){
                    nodes.push({id : entity.id ,name : entity.name, type : 2});
                    links.push({source: entity.id, target:  twin.id, value : twin.status==='connect'?1:0});
                }

            })
        }

        //links.push ({source: 10, target: 9,value : 1});

        return {
            nodes : nodes,
            links : links
        }
    },[twin_infos]);

    const getTwinList = useMemo(()  =>{
        
        var list = [];

        for (const [id, twin] of Object.entries(twin_infos)) {
            list.push(twin);
        }
        return list;

    },[twin_infos]);

    const getEntityList = useMemo(()  =>{
        var twin = twin_infos[twinSelectId]
        if(twin){
            return twin.entities;
        }else{
            return [];
        }
    },[twinSelectId]);

    useEffect(() => {
       // fgRef.current.d3Force("charge").strength(-200);
    });

    // useEffect(() => {
    //     getTwins(dispatch);
    //  }, []);

    // if (loading) return <div>로딩중..</div>;
    // if (error) return <div>에러가 발생했습니다</div>;
    // if (!twins) return <button onClick={fetchData}>불러오기</button>;

    return (
        <div className='dashboard'>
            <h1 >Dash Board</h1>
            {/* <div className='dashboard_top_wrap'>
                <StatusBox />
            </div> */}
            <div className='dashboard_wrap top'>
                <div className='dashboard_wrap_item'>
                    Twin List
                    <DataGrid
                        rows={getTwinList}
                        columns = {twin_columns}
                        pageSize = {20}
                        // checkboxSelection
                        onRowClick={(param)=>{
                            nodeFocusTableHandler(param.row,1);
                            //console.log(JSON.stringify(param.row));
                        }}
                        onSelectionModelChange ={(ids)=>{
                            setTwinSelectId(ids[0]);
                        }}
                    />
                    Entity List
                    <DataGrid
                        rows={getEntityList}
                        columns = {entity_colums}
                        pageSize = {20}
                        /* checkboxSelection */
                        // disableSelectionOnClick
                        onRowClick={(param)=>{
                            nodeFocusTableHandler(param.row,2);
                            //console.log(JSON.stringify(param.row));
                        }}
                    />
                    
                </div>
                <div className='dashboard_wrap_item'>
                    <ForceGraph2D 
                                extraRenderers={extraRenderers}
                                ref={fgRef}
                                width={1000}
                                height={900}
                                graphData={getNodeDatas}
                                linkColor={(link) => "#555"}
                                linkDirectionalParticles={4}
                                linkWidth={(link) => 3}
                                linkLineDash={(link) => {

                                    let dash = false;
                                    if(link.source.status === "disconnect" || link.target.status === "disconnect"){
                                        dash = true
                                    }
                                    console.log(link);
                                    return dash?[2,1]:null;
                                }}
                                nodeLabel={"id"}
                                // nodeAutoColorBy={"group"}
                                nodeColor={(node)=>{
                                    switch(node.type){
                                        case 0: // 카탈로그
                                            return '#ffffff'
                                        case 1: // 트윈
                                            if(node.status === 'connect'){
                                                return '#00ff00'
                                            }else{
                                                return '#ff0000'
                                            }
                                            
                                        case 2: // 트윈->노드
                                            return '#0000ff'
                                        default:
                                            return '#0000ff'
                                    }
                                }}
                                // .nodeColor(d => d.type=="OK" ? '#4caf50' : '#f44336')
                                // linkDirectionalParticles={"value"}
                                linkDirectionalParticleSpeed={d => d.value * 0.01}
                               /*  backgroundColor="aliceblue" */
                                /* linkCurveRotation={"rotation"}
                                linkCurvature={"curvature"} */
                                onNodeClick={nodeFocusHandler}
                                nodeCanvasObjectMode={() => "after"}
                                nodeCanvasObject={(node, ctx, globalScale) => {
                                    if(labelShow){
                                        const nodeLabel = node.name;
                                        const fontSize = 12 / globalScale;
                                        ctx.font = `${fontSize}px Sans-Serif`;
                                        ctx.textAlign = "center";
                                        ctx.textBaseline = "middle";
                                        ctx.fillStyle = "white";
                                        ctx.fillText(nodeLabel, node.x, node.y+ 7);
                                    }
                                
                                }}
                                // nodeThreeObjectExtend={true}
                                // nodeThreeObject={(node) => {
                                //     if(labelShow){
                                //         const nodeEl = document.createElement("div");
                                //         nodeEl.textContent = node.name;
                                //         nodeEl.style.fontFamily = "Comic Sans MS, Comic Sans";
                                //         nodeEl.style.color = "white";
                                //         nodeEl.style.top = "-35px";
                                //         return new CSS2DObject(nodeEl);
                                //     }else{
                                //         return;
                                //     }
                                // }}
                    />
                    <div className='dashboard_fg_cover'>
                        <button  className='dashboard_fg_cover_btn outline' onClick={()=> fgRef.current.zoomToFit(100)}>ZoomOut</button>
                        <button  className='dashboard_fg_cover_btn outline' onClick={()=> setLabelShow(!labelShow)}>Label Toggle</button>
                        {/* <button  className='dashboard_fg_cover_btn outline' onClick={()=> {
                            var random_id = getRandomInt(1,100000);


                            setNodes({
                                nodes:[...nodes.nodes,{id:random_id}],
                                links:[...nodes.links, {source: random_id, target: 0}]
                            })
                            
                        }}>ADD Twin</button> */}
                        
                        {/* <button  className='dashboard_fg_cover_btn outline' onClick={()=> {
                            setNodes({
                                ...nodes,
                                links:nodes.links.map(link => {
                                    //swap 
                                    var source = link.target;
                                    var target = link.source;

                                    return {...link,source:source,target:target}
                                })
                            })
                        }}>Reverse</button>
                        <button  className='dashboard_fg_cover_btn outline' onClick={()=> {
                            setNodes({
                                ...nodes,
                                links:nodes.links.map(link => {
                                    var value =  (link.value ==1?0:1);
                                    return {...link,value}
                                })
                            })
                        }}>Send Toggle</button> */}
                    </div>
                 </div>
                
                
                <div className='dashboard_wrap_item'>
                    <div style={{height:"900px","overflowY":"auto"}}>
                        Detail Info
                        {latestSelectId.type===0?'':
                            latestSelectId.type===1?
                            <DashboardJsonTwinView id={latestSelectId.id} interval={3000}/>
                            :<DashboardJsonEntityView id={latestSelectId.id} interval={3000}/>
                        }
                        
                    </div>
                </div>
            </div>
            <div className='dashboard_wrap'>
                <div className='dashboard_wrap_item'>
                    Event Log
                    <DataGrid
                            rows={event_logs}
                            columns = {log_columns}
                            pageSize = {10}
                            /* checkboxSelection */
                            // disableSelectionOnClick
                            onRowClick={(param)=>{
                               
                            }}
                        />
                </div>
                <div  style={{height:"1000px"}}>
                    
                </div>
            </div>
           
           
        </div>
    )
});