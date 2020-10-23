import React, { useState, useEffect } from "react";
import { Pie } from 'react-chartjs-2';
import { Row, Col } from 'reactstrap';
import { useParams } from "react-router";
import { useHistory } from "react-router-dom";
import Example from "./Analysis";
import ReactWordcloud from 'react-wordcloud';

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
    const [wordsB, setWordsB] = useState([]);
    const history = useHistory();
    let { hashtag } = useParams();;
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
        },
        tooltips: {
            callbacks: {
                label: function (tooltipItem, data) {
                    var dataset = data.datasets[tooltipItem.datasetIndex];
                    var total = dataset.data.reduce(function (previousValue, currentValue, currentIndex, array) {
                        return previousValue + currentValue;
                    });
                    var currentValue = dataset.data[tooltipItem.index];
                    var percentage = Math.floor(((currentValue / total) * 100) + 0.5);
                    return percentage + "%";
                },
                title: function (tooltipItem, data) {
                    return data.labels[tooltipItem[0].index];
                }
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
        },
        tooltips: {
            enabled: false
        },
        plugins: {
            datalabels: {
                formatter: (value, ctx) => {
                    let sum = 0;
                    let dataArr = ctx.chart.data.datasets[0].data;
                    dataArr.map(data => {
                        sum += data;
                    });
                    let percentage = (value * 100 / sum).toFixed(2) + "%";
                    return percentage;
                },
                color: 'black',
            }
        }
    }
    useEffect(() => {
        fetch(`/sentiment/${hashtag}`)
            .then(res => res.json())
            .then(data => setPieDataTrump(data.TrumpFeedback) & setPieDataBiden(data.BidenFeedback) & setWordsTP(data.Keywords.TrumpWordCloud) &
                setWordsB(data.Keywords.BidenWordCloud)
            );

    }, []);
    const callbacksT = {
        getWordTooltip: wordsTP => `${wordsTP.text} (${wordsTP.value * 15})`,
    }
    const callbacksB = {
        getWordTooltip: wordsB => `${wordsB.text} (${wordsB.value * 15})`,
    }
    const options = {
        rotations: 2,
        rotationAngles: [-45, 45],
        fontSizes: [12, 50]

    };

    const size = [600, 400];
    return (
        <div>
            <h3> Feedback for #{hashtag} </h3>
            <Row>

                <Col xs="5">

                    <Pie data={dataTrump} width={180}
                        height={50} options={optionT} />
                    <ReactWordcloud
                        callbacks={callbacksT}
                        options={options}
                        size={size}
                        words={wordsTP} />
                </Col>
                <Col xs="2"></Col>
                <Col xs="5">
                    <Pie data={dataBiden} width={180}
                        height={50} options={optionB} />
                    <ReactWordcloud
                        callbacks={callbacksB}
                        options={options}
                        size={size}
                        words={wordsB} />
                </Col>
            </Row>
        </div >
    );
}