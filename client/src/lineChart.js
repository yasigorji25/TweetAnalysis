import React, { useState, useEffect } from "react";
import { AgChartsReact } from 'ag-charts-react';
import { trackPromise } from 'react-promise-tracker';
import Loader from 'react-loader-spinner';
import { usePromiseTracker } from "react-promise-tracker";

export default function Line() {
    const [rowData, setRowData] = useState([]);
    // store all stocks at first and change while searching
    // get stock symbol by url
    // const pathName = "http://131.181.190.87:3001/history" + location.search;
    const LoadingIndicator = props => {
        const { promiseInProgress } = usePromiseTracker();

        return promiseInProgress &&
            <div
                style={{
                    width: "100%",
                    height: "100",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                }}
            >
                <Loader type="ThreeDots" color="#2BAD60" height="100" width="100" />
            </div>
    };

    useEffect(() => {
        trackPromise(
            fetch('/line')
                .then(res => res.json())
                .then(data =>
                    data.map(history => {
                        return {
                            Trump: history.Trump_sentiment,
                            Biden: history.Biden_sentiment,
                            timestamp: history.date.substring(0, 10),
                        };
                    })
                )
                .then(histories => setRowData(histories) & console.log(histories))
        )
    }, []);

    const options = {
        data: rowData,
        title: {
            text: 'Historical Search Trend',
            fontSize: 18,
        },
        series: [{
            xKey: 'timestamp',
            yKey: 'Trump',
        },
        {
            xKey: 'timestamp',
            yKey: 'Biden',
        }],


    }

    return (
        <main>
            <AgChartsReact options={options} />
            <LoadingIndicator />
        </main>
    )
}