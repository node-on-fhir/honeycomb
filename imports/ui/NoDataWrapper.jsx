import React, { useState } from 'react';

import { Button, Grid, CardHeader, CardContent, Typography } from '@mui/material';


import PropTypes from 'prop-types';

import { useNavigate } from "react-router-dom";

export function NoDataWrapper(props){

    const navigate = useNavigate();

    let { 
        children,
        dataCount,
        title,
        subheader,
        noDataImagePath,
        buttonLabel,
        marginTop,
        redirectPath,
        ...otherProps 
    } = props;
    
    // Meteor.absoluteUrl() + noDataImage
    
    function handleOpenPage(){
        if(redirectPath){
            navigate(redirectPath, { replace: true });
        } else {
            navigate("/", { replace: true });
        }
    }
    
    let dataManagementElements = null;
    if(dataCount > 0){
        if(children){
            dataManagementElements = children;
        }
    } else {
    let noDataImageElement;
    if(noDataImagePath){
        noDataImageElement = <img src={noDataImagePath} style={{width: '100%', marginTop: marginTop}} />;
    }
    dataManagementElements = <Grid justify="center" container spacing={8} style={{marginTop: '0px', marginBottom: '80px'}}>            
        <Grid item md={6}>
            <CardHeader title={title} subheader={subheader} />
            { noDataImageElement }
            <CardContent>
            <Button 
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleOpenPage.bind(this)}
            >{buttonLabel}</Button>

            </CardContent>
        </Grid>
      </Grid>
    }

    return(dataManagementElements);
}



NoDataWrapper.propTypes = { 
    dataCount: PropTypes.number,
    title: PropTypes.string,
    subheader: PropTypes.string,
    buttonLabel: PropTypes.string,
    noDataImagePath: PropTypes.string,
    marginTop: PropTypes.string,
    redirectPath: PropTypes.string
};
  
NoDataWrapper.defaultProps = {
    dataCount: 0,
    title: "No Data",
    subheader: "Click the button to begin importing data.",
    buttonLabel: "Import Data",
    noDataImagePath: "NoData.png",
    marginTop: "0px",
    redirectPath: "/import-data"
}
  
  export default NoDataWrapper