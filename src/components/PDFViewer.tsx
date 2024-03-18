import React from 'react'

type PDFViewerProps = {pdf_url: string}

export default function PDFViewer({ pdf_url }: PDFViewerProps) {
    
    const p_url = pdf_url; 
    const iframeurl = `https://docs.google.com/gview?url=${p_url}&embedded=true`;
    return <iframe src={iframeurl} title = 'pdf-viewer' className=" w-full h-full"></iframe>;
  }
