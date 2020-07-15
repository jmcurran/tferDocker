library(shiny)
library(shinyBS)

source("parameter_settings.R")

# Function for get the value from a list of parameters
# by name, or if it is not in that list then return
# an alternative value (NA by default)

getListValOr = function(list, name, or = NA) {
  
  if (name %in% names(list))
    return(list[[name]])

  return(or)
  
}



# Get vector of simulation parameter names
paramNames = names(parameters)


# We are going to create a list of arguments that will be provided
# to the shiny function tags$form() using do.call(). This is to save
# us specifying all the inputs manually. Initially specify the name
# and id of the form. Later we will add shiny input elements to the
# list.

formList = list(name = "parameters",
                id = "parameters-form")



# Loop through the parameters

for (name in paramNames) {
  
  # Get settings for the current parameter
  parCfg = parameters[[name]]
  
  # Name for shiny input element
  inputName = paste0("param_", name)
  
  # Label for input element
  inputLabel = getListValOr(parCfg, "label", name);
  
  if (getListValOr(parCfg, "select", FALSE)) {
    
    # use a select input for the current parameter

    input = selectInput(inputName,
                        name,
                        parCfg$opts,
                        parCfg$default,
                        FALSE,
                        FALSE)
    
  } else {
    
    # Use a numeric input for the current parameter
    
    if (getListValOr(parCfg, "prop", FALSE)) {
      # if parameter is a proportion, set min and max accordingly
      parCfg$min = 0
      parCfg$max = 1
    }
    
    input = numericInput(inputName,
                         name,
                         parCfg$default,
                         getListValOr(parCfg, "min"),
                         getListValOr(parCfg, "max"),
                         getListValOr(parCfg, "step", "any"))
    
  }
  
  
  
  help = tags$span(class = "help",
                   "data-help" = getListValOr(parCfg, "tooltip", name),
                   "data-label" = getListValOr(parCfg, "label", name),
                   "?")
  
  # Add the input to the form list, wrapped in a div element
  # (used for positioning and layout purposes)
  i = length(formList) + 1
  formList[[i]] = tags$div(help, input)
  
}


# Add the calculate button to the form list. When this button is
# clicked, a new simulation will be run in R.

formList[[i + 1]] = tags$div(id = "button-div",
                             actionButton(inputId = "run",
                                          label = "Simulate"))


# Start creating the user interface

shinyUI(fluidPage(
  
  # Head of document
  tags$head(
    
    # Document title.
    tags$title("Forensic Glass Transfer Probabilities"),
    
    # Custom stylesheet
    tags$link(rel = "stylesheet",
              href = "styles.css"),
    
    tags$noscript(tags$style("label {opacity: 1;}"))
    
  ),
  
  # Main heading
  tags$h1("Forensic Glass Transfer Probabilities"),
  
  # Parameters form
  do.call(tags$form, formList),
  
  # Container div for the simulation chart
  tags$div(id = "chart"),
  
  downloadButton("downloadData", "Download Data"),
  
  tags$div(id = "popups",
           
           tags$button(id = "diagram-button",
                       class = "btn btn-default",
                       "Model diagram"),
           
           tags$button(id = "about-button",
                       class = "btn btn-default",
                       "About")
           
  ),
  
  bsModal(
    
          id = "about-modal",
          title = "About this application",
          trigger = "about-button",
          
          tags$p("Original concept and application by James Curran, ",
                 "Department of Statistics, University of Auckland."),
          
          tags$p("This R Shiny application was built by David Banks, ",
                 "and uses the tfer package (by James Curran and Ting Yu Huang)",
                 "to run simulations."),
          
          tags$p("Contact: ",
                 tags$a(href = "mailto:j.curran@auckland.ac.nz",
                        "j.curran@auckland.ac.nz")
                 )
          
          ),
  
  bsModal(
    
    id = "diagram-modal",
    title = "Model diagram",
    trigger = "diagram-button",
    size = "large",
    
    tags$div(id = "model")
    
  ),
  
  # Script tag for adding simulation data to document
  htmlOutput("dataJSON"),
  
  # External scripts
  tags$script(src = "d3.min.js"),
  tags$script(src = "node-link-diagram.js"),
  tags$script(src = "tfer.js")
    
))
