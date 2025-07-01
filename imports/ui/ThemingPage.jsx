import React, { useState, Fragment } from 'react';

import { Info } from './Index'
import { useNavigate } from "react-router-dom";

import Switch from '@mui/material/Switch';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

import { history, useTheme } from './App';

import Wheel from '@uiw/react-color-wheel';
import ShadeSlider from '@uiw/react-color-shade-slider';
import { hsvaToHex } from '@uiw/color-convert';

export function ThemingPage(){
  const navigate = useNavigate();
  const { mode, toggleTheme } = useTheme();
  
  const [counter, setCounter] = useState(0);
  const [ darkMode, setDarkMode ] = useState(false);
  const [hsva, setHsva] = useState({ h: 214, s: 43, v: 90, a: 1 });

  const increment = () => {
    setCounter(counter + 1);
  };

  const darkModeLabel = { inputProps: { 'aria-label': 'Dark Mode' } };

  function onChange(value){
    console.log('onChange', value);  
  }

  return (
    <div id="ThemingPage" style={{padding: '20px'}}>
      <FormGroup>
        <FormControlLabel control={<Switch {...darkModeLabel} defaultChecked onClick={toggleTheme} />} label="Dark Mode" />
      </FormGroup>
      <Fragment>
        <Wheel color={hsva} onChange={(color) => setHsva({ ...hsva, ...color.hsva })} />
      </Fragment>
      <ShadeSlider
        hsva={hsva}
        onChange={(newShade) => {
          setHsva({ ...hsva, ...newShade });
        }}
      />
    </div>
  );
};

export default ThemingPage 