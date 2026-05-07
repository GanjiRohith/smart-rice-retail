export function extractDOM() {

  // =========================
  // CLICKABLE ELEMENTS
  // =========================

  const clickable = [

    ...document.querySelectorAll(
      `
      button,
      a,
      [role="button"],
      [onclick]
      `
    )

  ].filter(el =>

    !el.closest(
      "[data-ai-ignore='true']"
    )
  );


  // =========================
  // CLICKABLE MAP
  // =========================

  const clickableElements =
    clickable.map((el, index) => ({

      index,

      tag:
        el.tagName,

      text:
        el.innerText?.trim(),

      href:
        el.href || null,

      id:
        el.id || null,

      className:
        el.className || null,

      ariaLabel:
        el.getAttribute(
          "aria-label"
        ),

      title:
        el.getAttribute(
          "title"
        ),

      dataTestId:
        el.getAttribute(
          "data-testid"
        ),

      hasIcon:
        !!el.querySelector("svg"),

      rect: {
        x:
          el.getBoundingClientRect().x,

        y:
          el.getBoundingClientRect().y
      }
    }));


  // =========================
  // INPUTS
  // =========================

  const inputs = [

    ...document.querySelectorAll(
      "input"
    )

  ].map((input, index) => ({

    index,

    type:
      input.type,

    placeholder:
      input.placeholder,

    name:
      input.name,

    value:
      input.value,

    id:
      input.id
  }));


  // =========================
  // PAGE TEXT
  // =========================

  const pageText =
    document.body.innerText
      .slice(0, 5000);


  return {

    currentUrl:
      window.location.pathname,

    title:
      document.title,

    pageText,

    clickableElements,

    inputs
  };
}