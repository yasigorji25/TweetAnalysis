import React, { useState } from 'react';
import { ButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem, Container, Row, Col } from 'reactstrap';
import Image from 'react-bootstrap/Image'
import trumpImg from './trump.jpg'
import bidenImg3 from './biden3.jpg'
import { useHistory } from 'react-router-dom';
import { Link } from "react-router-dom";
const Example = (props) => {
    const [dropdownOpen, setOpen] = useState(false);
    const toggle = () => setOpen(!dropdownOpen);


    return (
        <Container>
            <Row>
                <Col xs="6" sm="4" />
                <Col xs="6" sm="4" >
                    <ButtonDropdown isOpen={dropdownOpen} toggle={toggle}>
                        <DropdownToggle caret color="danger">
                            Select hashtag
        </DropdownToggle>
                        <DropdownMenu>
                            <DropdownItem tag={Link} to="/sentiment/election"># Election</DropdownItem>
                            <DropdownItem tag={Link} to="/sentiment/democrats"># Democrats</DropdownItem>
                            <DropdownItem tag={Link} to="/sentiment/politics"># Politics</DropdownItem>
                            <DropdownItem tag={Link} to="/sentiment/republican"># Republican</DropdownItem>
                        </DropdownMenu>
                    </ButtonDropdown>
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
                        <p size="40">VS</p>
                    </span>
                </Col>
                <Col sm="4">
                    <Image src={bidenImg3} roundedCircle width="176" height="185" />
                    <h3>Biden</h3>
                </Col>

            </Row>
        </Container >
    );
}

export default Example;