function make_results_dict(
  density = 0,
  conversion = 0,
  underway = 0,
  not_underway = 0,
  cold_iron = 0,
  {
    x_underway = 0,
    x_not_underway = 0,
    x_cold_iron = 0,
    b_underway = 0,
    b_not_underway = 0,
    b_cold_iron = 0,
    optimum = 0,
    worst = 0,
    mission_days = 365,
    DAYS_PER_YEAR = 365,
    hours_year = 8760,
    lbs_to_ton = 0.0005,
  }
) {
  const results = {
    bbl_underway: (
      ((underway * x_underway + b_underway) * hours_year) /
      density
    ).toFixed(2),

    bbl_not_underway: (
      ((not_underway * x_not_underway + b_not_underway) * hours_year) /
      density
    ).toFixed(2),

    bbl_cold_iron: (
      ((cold_iron * x_cold_iron + b_cold_iron) * hours_year) /
      density
    ).toFixed(2),

    total_bbl_consumed: (
      ((underway * x_underway + b_underway) * hours_year) / density +
      ((not_underway * x_not_underway + b_not_underway) * hours_year) /
        density +
      ((cold_iron * x_cold_iron + b_cold_iron) * hours_year) / density
    ).toFixed(2),

    co2_underway: (
      (((underway * x_underway + b_underway) * hours_year) / density) *
      conversion *
      lbs_to_ton
    ).toFixed(2),

    co2_not_underway: (
      (((not_underway * x_not_underway + b_not_underway) * hours_year) /
        density) *
      conversion *
      lbs_to_ton
    ).toFixed(2),

    co2_cold_iron: (
      (((cold_iron * x_cold_iron + b_cold_iron) * hours_year) / density) *
      conversion *
      lbs_to_ton
    ).toFixed(2),

    total_co2_used: (
      (((underway * x_underway + b_underway) * hours_year) / density) *
        conversion *
        lbs_to_ton +
      (((not_underway * x_not_underway + b_not_underway) * hours_year) /
        density) *
        conversion *
        lbs_to_ton +
      (((cold_iron * x_underway + b_cold_iron) * hours_year) / density) *
        conversion *
        lbs_to_ton
    ).toFixed(2),

    optimum_range:
      (
        (((underway * x_underway + b_underway) * hours_year) / density) *
        optimum
      ).toFixed(2) || 0,

    worst_range:
      (
        (((underway * x_underway + b_underway) * hours_year) / density) *
        worst
      ).toFixed(2) || 0,

    optimum_co2:
      ((((not_underway * x_not_underway + b_not_underway) * hours_year) /
        density) *
        conversion *
        lbs_to_ton) /
        (
          (((underway * x_underway + b_underway) * hours_year) / density) *
          optimum
        ).toFixed(9) || 0,

    worst_co2:
      ((((underway * x_underway + b_cold_iron) * hours_year) / density) *
        conversion *
        lbs_to_ton) /
        (
          (((underway * x_underway + b_underway) * hours_year) / density) *
          worst
        ).toFixed(9) || 0,

    co2_mission:
      ((((underway * x_underway + b_underway) * hours_year) / density) *
        conversion *
        lbs_to_ton +
        (((not_underway * x_not_underway + b_not_underway) * hours_year) /
          density) *
          conversion *
          lbs_to_ton +
        (((cold_iron * x_underway + b_cold_iron) * hours_year) / density) *
          conversion *
          lbs_to_ton) *
      (mission_days / DAYS_PER_YEAR).toFixed(2),
  };
  //console.log(results);
  return results;
}
