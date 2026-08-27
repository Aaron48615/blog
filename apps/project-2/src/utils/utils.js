export const formatHtml = (content) => {
  content = content.replace(
    /\<img/gi,
    '<img style="width:100% !important;height:auto !important;margin:0;display:flex;" ',
  );
  content = content.replace(
    /\<td/gi,
    '<td  cellspacing="0" cellpadding="0" border="0" style="display:block;vertical-align:top;margin: 0px; padding: 0px; border: 0px;outline-width:0px;" ',
  );
  content = content.replace(/width=/gi, "sss=");
  content = content.replace(/height=/gi, "sss=");
  content = content.replace(
    / \/\>/gi,
    ' style="max-width:100% !important;height:auto !important;margin:0;display:block;" \/\>',
  );
  return content;
};
