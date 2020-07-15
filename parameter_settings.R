#
# This file contains settings for each parameter which can be set
# in the tfer::transfer() function. It also specifies settings for
# creating HTML input elements for each parameter.
#
#
# `default` = initial value to set for HTML element.
# `min`     = min allowed value (numeric HTML inputs only).
# `max`     = max allowed value (numeric HTML inputs only).
# `step`    = step size (numeric HTML inputs only).
# `prop`    = is this parameter a proportion? Setting to true
#             means min and max will automatically be set to
#             0 and 1 respectively.
# `select`  = should this parameter be represented by an HTML
#             select element?
# `opts`    = Only for select elements. Specify option values.
#

parameters = list(
  
  N = list(
    default = 10000,
    min = 100,
    max = 1e6,
    step = 1,
    tooltip = "Sample size",
    label = "Sample size"
  ),
  
  d = list(
    default = 0.5,
    min = 0,
    tooltip = "The breaker's distance from the window (metres)",
    label = "Distance"
  ),
  
  deffect = list(
    select = TRUE,
    default = TRUE,
    opts = list(Yes = TRUE, No = FALSE),
    tooltip = "Distance effect enabled",
    label = "Distance effect"
  ),
  
  lambda = list(
    default = 120,
    min = 0,
    tooltip = "Average number of fragments transferred to the breaker's clothing",
    label = "&lambda;"
  ),
  
  Q = list(
    default = 0.05,
    prop = TRUE,
    tooltip = "Proportion of high persistence fragments",
    label = "Q"
  ),
  
  l0 = list(
    default = 0.8,
    prop = TRUE,
    tooltip = "Lower bound on the proportion of fragments lost in the first hour",
    label = "l_{0}"
  ),
  
  u0 = list(
    default = 0.9,
    prop = TRUE,
    tooltip = "Upper bound on the proportion of fragments lost in the first hour",
    label = "u_{0}"
  ),
  
  lstar0 = list(
    default = 0.1,
    prop = TRUE,
    tooltip = "Lower bound on the proportion of high persistence fragments lost in the first hour",
    label = "l*_{0}"
  ),
  
  ustar0 = list(
    default = 0.15,
    prop = TRUE,
    tooltip = "Upper bound on the proportion of high persistence fragments lost in the first hour",
    label = "u*_{0}"
  ),
  
  lj = list(
    default = 0.45,
    prop = TRUE,
    tooltip = "Lower bound on the proportion of fragments lost in the j^{th} hour",
    label = "l_{j}"
  ),
  
  uj = list(
    default = 0.7,
    prop = TRUE,
    tooltip = "Upper bound on the proportion of fragments lost in the j^{th} hour",
    label = "u_{j}"
  ),
  
  lstarj = list(
    default = 0.05,
    prop = TRUE,
    tooltip = "Lower bound on the proportion of high persistence fragments lost in the j^{th} hour",
    label = "l*_{j}"
  ),
  
  ustarj = list(
    default = 0.1,
    prop = TRUE,
    tooltip = "Upper bound on the proportion of high persistence fragments lost in the j^{th} hour",
    label = "u*_{j}"
  ),
  
  lR = list(
    default = 0.5,
    prop = TRUE,
    tooltip = "Lower bound on the proportion of fragments expected to be detected in the lab",
    label = "l_{R}"
  ),
  
  uR = list(
    default = 0.7,
    prop = TRUE,
    tooltip = "Upper bound on the proportion of fragments expected to be detected in the lab",
    label = "u_{R}"
  ),
  
  lt = list(
    default = 1,
    min = 0,
    tooltip = "Lower bound for time between the crime and apprehension of suspect (hours)",
    label = "l_{t}"
  ),
  
  ut = list(
    default = 2,
    min = 0,
    tooltip = "Upper bound for time between the crime and apprehension of suspect (hours)",
    label = "u_{t}"
  ),
  
  r = list(
    default = 0.5,
    prop = TRUE,
    tooltip = "Value of r in t_{i} ~ NegBinom(t, r)",
    label = "r"
  ), 
  
  timeDist = list(
    select = TRUE,
    default = "negbin",
    opts = list('Negative Binomial' = "negbin", 
                'Constrained Negative Binomial' = "cnegbin",
                'Uniform' = "uniform"),
    tooltip = "Distribution for time",
    label = "Time distribution"
  )
  
)
