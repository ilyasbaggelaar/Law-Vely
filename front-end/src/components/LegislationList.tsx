import { Link, useLocation } from "react-router-dom";
import LegislationCard from "./LegislationCard";

interface Legislation {
  id: string;
  summaryOfLegislation: string;
  summaryOfSubSections: string;
  timestamp: number;
  title: string;
  categories: string[];
  url: string;
  legislationDate: string;
}

interface LegislationListProps {
  legislation: Legislation[];
}

function LegislationList({ legislation }: LegislationListProps) {
  const location = useLocation();

  return (
    <div className="grid grid-cols-1 gap-10 p-4 md:grid-cols-1 lg:grid-cols-3">
      {legislation.map((leg) => (
        <Link
          key={leg.id}
          to={{
            pathname: `/legislations/${leg.id}`,
            search: location.search,
          }}
          className="transition-transform duration-200 hover:scale-105"
        >
          <LegislationCard
            title={leg.title}
            legislationDate={leg.legislationDate}
            categories={leg.categories}
          />
        </Link>
      ))}
    </div>
  );
}

export default LegislationList;
