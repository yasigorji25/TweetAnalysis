import React, { useState, useEffect } from "react";
import { Pie } from 'react-chartjs-2';
import { Container, Row, Col } from 'reactstrap';
import { useParams } from "react-router";
import Example from "./Analysis";

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
    
    let { hashtag } = useParams();
    console.log(hashtag);

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
            .then(data => setPieDataTrump(data.TrumpFeedback) & setPieDataBiden(data.BidenFeedback) & console.log('get from')
            );



    }, [hashtag]);
    return (
        <div>
            <h3> Feedback for #{hashtag} </h3>
            <Row>

                <Col xs="4">

                    <Pie data={dataTrump} width={120}
                        height={50} options={optionT} /></Col>
                <Col xs="4"></Col>
                <Col xs="4">
                    <Pie data={dataBiden} width={120}
                        height={50} options={optionB} /></Col>
            </Row>
        </div >
    );
}

