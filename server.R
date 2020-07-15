
# Code by David Banks <davidgbanks@gmail.com>
# Original concept and application by James Curran <j.curran@auckland.ac.nz>


library(shiny)
library(tfer)

source("parameter_settings.R")

# Get vector of simulation parameter names
paramNames = names(parameters)



# Create shiny server

shinyServer(function(input, output, session) {
  
  # Reactive values store
  rv = reactiveValues()
  
  # transfer is where we will place the simulation results from the
  # tfer::transfer() function.
  rv$transfer = NULL

  
  observe({
    
    # Observe changes in the run input parameter. This is linked to the
    # 'Calculate' action button, which increase the run input parameter
    # by 1 every time it is clicked.
    r = input$run
    
    # List of simulation parameters
    paramList = list()
    
    # Make sure we don't take a dependency on any of the simulation input
    # elements by using isolate(). We only want this code to execute when
    # the Calculate button is clicked.
    isolate({
      
      # Get input values from the web document
      for (name in paramNames){
        if(name == "deffect"){
          paramList[[name]] = as.logical(input[[paste0('param_', name)]])
        }else if(name == "timeDist"){
          paramList[[name]] = as.character(input[[paste0('param_', name)]])
        }else{
          paramList[[name]] = as.numeric(input[[paste0('param_', name)]])  
        }
        
      }
        
      
      # Run the simulation and update the values
      rv$transfer = tfer::getValues(do.call(tfer::transfer, paramList))
      
    })
    
  })
  
  
  # Inject simulation results into the web document as a javascript
  # array, and call the setData() javascript function on it to make
  # sure any data watchers are invoked as a result.
  
  output$dataJSON = reactive({
    
    paste("<script>",
          "setData([",
          paste(rv$transfer, collapse=","),
          "]);",
          "</script>")
    
  })
  
  
  output$downloadData = downloadHandler(
    filename = "fragments.csv",
    content = function(file) {
      cat(paste(rv$transfer, collapse = ","), file = file)
    },
    contentType = "text/csv"
  )

  
})
