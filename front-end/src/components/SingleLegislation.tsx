import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchLegislationById } from "../api";
import SingleLegislationCard from "./SingleLegislationCard";

interface Legislation {
  id: string;
  summaryOfLegislation: string;
  summaryOfSubSections: string;
  timestamp: number;
  title: string;
}

function SingleLegislation() {
  const [legislation, setLegislation] = useState<Legislation>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<string | null>(null);

  const { legislation_id } = useParams<{ legislation_id: string }>();

  useEffect(() => {
    setIsLoading(true);
    fetchLegislationById(legislation_id!)
      .then((data) => {
        setLegislation(data);
      })
      .catch((error) => {
        setHasError(error.message || "Failed to fetch legislation");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [legislation_id]);

  if (isLoading) return <p>Loading...</p>;
  if (hasError) return <p>Error: {hasError}</p>;

  return <SingleLegislationCard legislation={legislation} />;
}

export default SingleLegislation;


//   return (
//     <div className='flex flex-col items-center p-6 bg-white shadow-lg rounded-lg max-w-4xl mx-auto mt-6'>
//       {legislation ? (
//         <>
//         <SingleLegislationCard 
//             title={legislation.title}
//             summary={legislation.summaryOfLegislation}
//             subsections={legislation.summaryOfSubSections}
//             date={legislation.timestamp}
//         />
//         </>
//       ) : (
//         <p className='text-center text-gray-500'>No legislation found.</p>
//       )}
//     </div>
//   );
// }

