import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { listPages } from "../api/pages";
import PageEditor from "./PageEditor";

export default function PageEditorRoute() {
  const { pageId } = useParams();
  const [pageMeta, setPageMeta] = useState(null);

  useEffect(() => {
    listPages()
      .then((pages) => {
        const found = pages.find((p) => p._id === pageId);
        setPageMeta(found || { title: "Untitled" });
      })
      .catch(() => setPageMeta({ title: "Untitled" }));
  }, [pageId]);

  if (!pageMeta) return <div style={{ padding: 40 }}>Loading page...</div>;

  return <PageEditor pageId={pageId} initialTitle={pageMeta.title} />;
}
