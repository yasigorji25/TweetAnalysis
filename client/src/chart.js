import React, { useState } from "react";
import { Pie } from 'react-chartjs-2';
import { Button, Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Container, Row, Col } from 'reactstrap';
import Image from 'react-bootstrap/Image'
import trumpImg from './trump.jpg'
import bidenImg3 from './biden3.jpg'
import ReactWordcloud from 'react-wordcloud';
import { useHistory } from "react-router-dom"

export default function pie() {

    return (
        <main>
            <ShowPieChart />
        </main>
    )
}
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

function ShowPieChart() {
    const [pieDataTrump, setPieDataTrump] = useState([]);
    const [pieDataBiden, setPieDataBiden] = useState([]);
    const [wordsTP, setWordsTP] = useState([]);
    const [wordsB, setWordsB] = useState([]);
    const [hashtag, setHashtag] = useState();
    const [legendDisplay, setLegendDisplay] = useState(false);
    const toggle = () => setDropdownOpen(prevState => !prevState);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const history = useHistory();

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
            display: legendDisplay,
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
    const optionB = {
        legend: {
            position: 'right',
            display:legendDisplay,
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
    const size = [600, 400];

    const handleChange = event => {
        setLegendDisplay(true);

        setWordsTP([]);
        setWordsB([]);
        setHashtag('Feedback for #'+event.target.value);
        fetch(`/sentiment/${event.target.value}`)
            .then(res => res.json())
            .then(data => setPieDataTrump(data.TrumpFeedback) & setPieDataBiden(data.BidenFeedback) & setWordsTP(data.Keywords.TrumpWordCloud) &
                setWordsB(data.Keywords.BidenWordCloud)
            );
    };

    const handleClickLine = event => {
        history.push("/linechart");
    }
    return (
        <div>
            <Container>
                <Row>
                    <Col xs="6" sm="4" />
                    <Col xs="6" sm="4" >
                        <Dropdown isOpen={true} toggle={toggle}>
                        <DropdownToggle
                            tag="b"
                            data-toggle="dropdown"
                        >
                            ** Select a hashtag **
                        </DropdownToggle>
                            <DropdownMenu>
                                <DropdownItem name="election" value="election" onClick={handleChange}># Election</DropdownItem>
                                <DropdownItem name="democrats" value="democrats" onClick={handleChange}># Democrats</DropdownItem>
                                <DropdownItem name="politics" value="politics" onClick={handleChange}># Politics</DropdownItem>
                                <DropdownItem name="republican" value="republican" onClick={handleChange}># Republican</DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </Col>
                    <Col sm="4" />
                </Row>
                <Row>
                    <Col xs="6" sm="4">
                        <Image src={trumpImg} roundedCircle width="171" height="180" />
                        <h3>Trump</h3>
                    </Col>
                    <Col xs="6" sm="4" >
                        <span className="vs">
                        </span>
                    </Col>
                    <Col sm="4">
                        <Image src={bidenImg3} roundedCircle width="176" height="185" />
                        <h3>Biden</h3>
                    </Col>

                </Row>

                <Row>                    
                    <Col xs="6" sm="12" >
                        <span className="vs">
                            <p size="40">VS</p>
                        </span>
                    </Col>
                </Row>
            </Container >
            <div>
                <h3> {hashtag} </h3>
                <Row style={{ 'width': '100%' }}>
                    <Col xs="4">
                        <Pie data={dataTrump} width={150}
                            height={50} options={optionT} />
                        <ReactWordcloud
                            callbacks={callbacksT}
                            options={options}
                            size={size}
                            words={wordsTP} />
                    </Col>
                    <Col xs="4">
                        <Button color="primary" onClick={handleClickLine}> Historical Search</Button>{' '}
                    </Col>
                    <Col xs="4">
                        <Pie data={dataBiden} width={150}
                            height={50} options={optionB} />
                        <ReactWordcloud
                            callbacks={callbacksB}
                            options={options}
                            size={size}
                            words={wordsB} />
                    </Col>
                </Row>
            </div >
        </div>
    );
}