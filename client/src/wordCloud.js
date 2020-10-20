import React, { useState, useEffect } from "react";
import ReactWordcloud from 'react-wordcloud';
import { useParams } from "react-router";



// export default function WordCloud() {

//     return (
//         <main>
//             <MyWordcloud />
//         </main>
//     )
// }
export default function MyWordcloud() {
    // const [pieDataTrump, setPieDataTrump] = useState([]);
    // const [pieDataBiden, setPieDataBiden] = useState([]);

    let { hashtag } = useParams();
    useEffect(() => {
        console.log("Heyyyyy");
        fetch(`/sentiment/${hashtag}`)

            .then(res => res.json())
            .then(data => console.log(data)
            );



    }, [hashtag]);
    return null;
}
