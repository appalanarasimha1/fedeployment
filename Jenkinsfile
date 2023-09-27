pipeline {
    
  agent any

	environment{
	    DOCHUBCREDS=credentials('DOCKERLOGIN')
	}
	
	
	stages {
	 stage('Docker') {
    agent any
      steps {
          sh ''' docker login  https://jed.ocir.io -u $DOCHUBCREDS_USR -p  "$DOCHUBCREDS_PSW" ''' 
          }
    }
	    
stage('Docker Build') {
    agent any
      steps {
        sh 'docker build -t jed.ocir.io/axnfm4jb3i73/groundx_fe_uat_an .'
        sh 'docker tag  jed.ocir.io/axnfm4jb3i73/groundx_fe_uat_an jed.ocir.io/axnfm4jb3i73/groundx_fe_uat_an:v21707.3'
	
	
      }
    }
  	
     
 
    
    
  }
}

