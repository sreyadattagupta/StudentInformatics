const User = require('../models/Admin');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path=require('path')
const mysql=require('mysql2');
require('dotenv').config()
// Authentication middleware



  const conn = mysql.createConnection(process.env.DATABASE_URL);
  conn.connect((err) => {
    if (err) {
      console.error('Database connection failed:', err.stack);
    }
    console.log('Connected to the database.');
  });


module.exports.signup = (req,res) => {
    const { name, email, password } = req.body;

    if(!name || !email || !password){
        res.status(400).json({msg: 'Please enter all fields'});
    }

    User.findOne({email})
    .then(user => {
        if(user) return res.status(400).json({msg: 'User already exists'});

        const newUser = new User({ name, email, password });

        // Create salt and hash
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, (err, hash) => {
                if(err) throw err;
                newUser.password = hash;
                newUser.save()
                    .then(user => {
                        jwt.sign(
                            { id: user._id },
                            config.get('jwtsecret'),
                            { expiresIn: 3600 },
                            (err, token) => {
                                if(err) throw err;
                                res.json({
                                    token,
                                    user: {
                                        id: user._id,
                                        name: user.name,
                                        email: user.email
                                    }
                                });
                            }
                        )

                    });
            })
        })
    })
    .catch(err =>{
        console.log(err);
    });
}

// Login controller
module.exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Sign JWT token and set cookie
    const token = jwt.sign({ id: user._id }, config.get('jwtsecret'), { expiresIn: '1h' });
    res.cookie('jwt', token, { httpOnly: true, maxAge: 3600000 });
    res.redirect('/admin/dashboard');
    
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
}

// Logout controller
module.exports.logout = (req, res) => {
  res.clearCookie('jwt');
//   res.json({ msg: 'Logged out' });
    // req.flash('Logged Out', 'You are successfully logged out')
  res.redirect('/');
}

// Get user controller
module.exports.get_user = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
}

//admin dashboard
module.exports.dashboard = async (req,res)=>{
  fs.readFile('./frontend/dashboard.html','utf8',(err,data)=>{
      if(err){
          console.log(err);
          return res.status(500).send('Error reading file');
      }
      console.log(req.user.name)
      const name = req.user.name;
      // let result = data.replace(/%name%/g, name);
      conn.query('SELECT COUNT(id) FROM students', (error, results) => {
        if (error) throw error;

        const count=results[0]['COUNT(id)'];
        console.log(count);
        conn.query('SELECT COUNT(DISTINCT coursecode) AS unique_count FROM course',(er,re)=>{
          if(er)throw er;
          const count1=re[0].unique_count;
          console.log(count1);
          let result = data.replace(/%count%/, count).replace(/%name%/g, name).replace(/%courses%/g,count1);
          // console.log(result);
          res.send(result);
        })
        
        
    })
      // send the modified HTML to the client
      // res.send(result);
  })
}

module.exports.viewStudents = async (req, res) => {
  // Execute the SQL query to retrieve all students
  fs.readFile('./frontend/studentTable.html','utf8',(err,data)=>{
    if(err){
        console.log(err);
        return res.status(500).send('Error reading file');
    }
    conn.query('SELECT * FROM students', (error, results) => {
      if (error) throw error;
      // Generate the HTML content with the student data
      let html = '<table>';
      html += '<thead class="tablehead"><tr><th class="th">ID</th><th class="th th1">Name</th><th class="th">Department</th><th class="th">Semester</th><th class="th">CPI</th></tr></thead>';
      html+='<tbody class="tablebody">'
      results.forEach((student) => {
        // console.log(student)
        html += `<tr><td class="td">${student.id}</td><td class="td">${student.name}</td><td class="td">${student.dept}</td><td class="td">${student.sem}</td><td class="td">${student.cpi}</td></tr>`;
        html+=""
      });
      html += '</tbody>></table>';
      // Send the HTML content as the response
      
      const result1=data.replace(/%table%/g,html)
      // console.log(result1)
      res.send(result1);
  })
  })
  
}

module.exports.addStudents = (req, res) => {
  conn.query(`INSERT INTO students VALUES (${req.body.id}, '${req.body.name}', '${req.body.password}','${req.body.dept}',${req.body.sem},${req.body.cpi})`, (err, result) => {
    if (err) throw err;
    console.log(`Inserted student with ID ${req.body.id} and name ${req.body.name}.`);
    res.send(`Inserted student with ID ${req.body.id} and name ${req.body.name}.`);
  });
};
module.exports.addStudent= (req,res) =>{
  // console.log(path.join(__dirname, '../frontend/myFile.html'));
  res.sendFile(path.join(__dirname, '../frontend/addStudent.html'));
}
module.exports.addCourses = (req,res) =>{
  conn.query(`INSERT into course VALUES ('${req.body.code}','${req.body.coursename}','${req.body.dept}',${req.body.sem},${req.body.mandatory})`,(err,result)=>{
    if(err) throw err;
    console.log(`Inserted course with code ${req.body.code} and name ${req.body.coursename}.`);
    res.send(`Inserted course with code ${req.body.code} and name ${req.body.coursename}.`);
  })

}
module.exports.addCourse= (req,res) =>{
  // console.log(path.join(__dirname, '../frontend/myFile.html'));
  res.sendFile(path.join(__dirname, '../frontend/addCourse.html'));
}
module.exports.viewCourses = async (req, res) => {
  fs.readFile('./frontend/studentTable.html','utf8',(err,data)=>{
    if(err){
        console.log(err);
        return res.status(500).send('Error reading file');
    }
  // Execute the SQL query to retrieve all courses
  
  conn.query('SELECT * FROM course', (error, results) => {
    if (error) throw error;
    // Generate the HTML content with the course data
    let html = '<table>';
    html += '<thead class="tablehead"><tr><th class="th th1">Course Code</th><th class="th th2">Name</th><th class="th">Department</th><th class="th">Semester</th><th class="th">Mandatory</th></tr></thead>';
    html+='<tbody class="tablebody">'
    results.forEach((course) => {
      html += `<tr><td class="td">${course.coursecode}</td><td class="td">${course.coursename}</td><td class="td">${course.dept}</td><td class="td">${course.sem}</td><td class="td">${course.mandatory ? 'Yes' : 'No'}</td></tr>`;
    });
    html += '</tbody></table>';
    // Send the HTML content as the response
    // res.send(html);
    const result1=data.replace(/%table%/g,html)
      // console.log(result1)
      
  res.send(result1);
  });
  
})
}

module.exports.reset = (req,res)=>{
  conn.query('DELETE FROM reg_courses',(err,result)=>{
    if(err) throw err;
    console.log('Deleted all students');
    res.send('Deleted all students');
  })
}

module.exports.updateStudent = (req, res) => {
  const { id, sem, cpi } = req.body;
  const sql = `UPDATE students SET sem = ?, cpi = ? WHERE id = ?`;
  conn.query(sql, [sem, cpi, id], (error, result) => {
    if (error) throw error;
    if (result.affectedRows === 0) {
      return res.status(404).send(`No student found with id ${id}`);
    }
    res.send(`Student with id ${id} has been updated`);
  });
};

module.exports.sendUpdateStudent= (req,res) =>{
  // console.log(path.join(__dirname, '../frontend/myFile.html'));
  res.sendFile(path.join(__dirname, '../frontend/updateStudent.html'));
}
