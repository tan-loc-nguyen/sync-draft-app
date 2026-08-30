import { useRouteError } from "react-router-dom";

import { getErrorMessage } from "@/lib/errors";

export default function Error() {
  const error: unknown = useRouteError();
  console.error(error);

  return (
    <div id="error-page">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>{getErrorMessage(error)}</i>
      </p>
    </div>
  );
};