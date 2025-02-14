import { Typography, Slider, Switch, Button, TextField, IconButton } from "@mui/material"
import { FileCopy as FileCopyIcon } from "@mui/icons-material"

const GeneratorView = ({ generatorOptions, setGeneratorOptions, generatedPassword, generatePassword }) => {
  return (
    <>
      <Typography variant="h5" gutterBottom>
        <br></br>
        Password Generator
      </Typography>
      <Typography gutterBottom>Password Length: {generatorOptions.length}</Typography>
      <Slider
        value={generatorOptions.length}
        onChange={(_, newValue) => setGeneratorOptions({ ...generatorOptions, length: newValue })}
        min={8}
        max={32}
        valueLabelDisplay="auto"
      />
      <div>
        <Switch
          checked={generatorOptions.uppercase}
          onChange={(e) => setGeneratorOptions({ ...generatorOptions, uppercase: e.target.checked })}
        />
        <Typography component="span">Include Uppercase</Typography>
      </div>
      <div>
        <Switch
          checked={generatorOptions.lowercase}
          onChange={(e) => setGeneratorOptions({ ...generatorOptions, lowercase: e.target.checked })}
        />
        <Typography component="span">Include Lowercase</Typography>
      </div>
      <div>
        <Switch
          checked={generatorOptions.numbers}
          onChange={(e) => setGeneratorOptions({ ...generatorOptions, numbers: e.target.checked })}
        />
        <Typography component="span">Include Numbers</Typography>
      </div>
      <div>
        <Switch
          checked={generatorOptions.symbols}
          onChange={(e) => setGeneratorOptions({ ...generatorOptions, symbols: e.target.checked })}
        />
        <Typography component="span">Include Symbols</Typography>
      </div>
      <Button variant="contained" color="secondary" onClick={generatePassword} sx={{ mt: 2 }}>
        Generate Password
      </Button>
      <TextField
        fullWidth
        label="Generated Password"
        value={generatedPassword}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <IconButton onClick={() => navigator.clipboard.writeText(generatedPassword)}>
              <FileCopyIcon />
            </IconButton>
          ),
        }}
        sx={{ mt: 2 }}
      />
    </>
  )
}

export default GeneratorView

