const observer = new MutationObserver(() => {
  const container = document.querySelector(".swagger-ui");
  if (container) {
    observer.disconnect();

    const header = document.createElement("div");
    header.innerHTML = `
        <div style="
            background: linear-gradient(90deg, #377fb1, #004b8f);
            color: white;
            padding: 20px 24px;
            display: flex;
            align-items: center;
        ">
            <img src="/swagger/logo.png" style="height:50px; margin-right:12px;" />

            <div>
            <div style="font-size:18px; margin-left: 5px; font-weight:600;">
                YNY TECHNOLOGY SDN BHD
            </div>
            <div style="font-size:12px; margin-left: 5px; opacity:0.8;">
                Internal Documentation
            </div>
            </div>

            <div style="margin-left:auto; font-size:12px;">
            v1.0.0
            </div>
        </div>
    `;

    container.prepend(header);
  }
});

observer.observe(document.body, { childList: true, subtree: true });