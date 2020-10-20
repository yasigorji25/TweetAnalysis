import React, { useState, useEffect } from "react";
import { Pie } from 'react-chartjs-2';
import { Container, Row, Col, Button } from 'reactstrap';
import { useParams } from "react-router";
import { useHistory } from "react-router-dom";
import Example from "./Analysis";
import ReactWordcloud from 'react-wordcloud';
//import MyWordcloud from "./wordCloud.js"

export default function pie() {

    return (
        <main>
            <Example />
            <ShowPieChart />
        </main>
    )
}
function ShowPieChart() {
    const [pieDataTrump, setPieDataTrump] = useState([]);
    const [pieDataBiden, setPieDataBiden] = useState([]);
    const [wordsTP, setWordsTP] = useState([]);
    const history = useHistory();
    let { hashtag } = useParams();
    const navigateTo = () => history.push(`/sentiment/insight`);
    const dataTrump = {
        labels: [
            'Positive',
            'Negative',
            'Netural'

        ],
        datasets: [{
            data: pieDataTrump,
            backgroundColor: [
                '#36A2EB',
                '#FF6384',
                '#FFCE56'
            ],
            hoverBackgroundColor: [
                '#36A2EB',
                '#FF6384',
                '#FFCE56'
            ],

        }],

    }
    const optionT = {
        legend: {
            position: 'left',

            labels: {
                padding: 20
            }
        }
    }

    const dataBiden = {
        labels: [
            'Positive',
            'Negative',
            'Netural'
        ],
        datasets: [{
            data: pieDataBiden,
            backgroundColor: [
                '#36A2EB',
                '#FF6384',
                '#FFCE56'
            ],
            hoverBackgroundColor: [
                '#36A2EB',
                '#FF6384',
                '#FFCE56'
            ]
        }]
    };

    const optionB = {
        legend: {
            position: 'right',

            labels: {
                padding: 20

            }
        }
    }
    useEffect(() => {


        fetch(`/sentiment/${hashtag}`)
            .then(res => res.json())
            .then(data => setPieDataTrump(data.TrumpFeedback) & setPieDataBiden(data.BidenFeedback) & setWordsTP(data.Keywords.TrumpPositive)
            );



    }, [hashtag]);
    const callbacks = {
        getWordColor: wordsTP => wordsTP.value >= 2 ? "blue" : "red",
        onWordClick: console.log,
        onWordMouseOver: console.log,
        getWordTooltip: wordsTP => `${wordsTP.text} (${wordsTP.value}) [${wordsTP.value >= 2 ? "good" : "bad"}]`,
    }
    const options = {
        rotations: 2,
        rotationAngles: [-90, 0],
        fontSizes: [10, 50],
    };
    const size = [600, 400];
    return (
        <div>
            <h3> Feedback for #{hashtag} </h3>
            <Row>

                <Col xs="4">

                    <Pie data={dataTrump} width={120}
                        height={50} options={optionT} />

                    {/* <Button color="primary" >Get more insight! </Button> */}
                    <ReactWordcloud
                        callbacks={callbacks}
                        options={options}
                        size={size}
                        words={wordsTP} />
                </Col>
                <Col xs="4"></Col>
                <Col xs="4">
                    <Pie data={dataBiden} width={120}
                        height={50} options={optionB} /></Col>
            </Row>
        </div >
    );
}

// function MyWordcloud() {
//     // const [pieDataTrump, setPieDataTrump] = useState([]);
//     // const [pieDataBiden, setPieDataBiden] = useState([]);

//     let { hashtag } = useParams();
//     useEffect(() => {
//         console.log("Heyyyyy");
//         fetch(`/sentiment/${hashtag}`)

//             .then(res => res.json())
//             .then(data => console.log(data)
//             );



//     }, [hashtag]);
//     return null;
// }