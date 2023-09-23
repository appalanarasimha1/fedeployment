pipeline {
    
  agent any

	environment{
	    DOCHUBCREDS=credentials('DOCKERLOGIN')
	}
	
	
	stages {
	    
	stage('Docker Build') {
    agent any
      steps {
        sh 'docker build -t fedimg4 .'
        sh 'docker images'
      }
    }
  	
   
    stage('Docker') {
    agent any
      steps {
          sh ''' docker login  https://jed.ocir.io -u $DOCHUBCREDS_USR -p  "$DOCHUBCREDS_PSW" ''' 
          }
    }
    
    stage('Deploy to K8s')
		{
		    
			steps{
				sshagent(['k8slogin'])
				{
					
					script{
						try{
							sh 'ssh -v opc@10.149.63.235 kubectl apply -f nodeapp-deployment.yaml -n an'
							sh 'kubectl get pods -n an'
							sh 'kubectl get deployments -n an'
							sh 'kubectl get svc -n an'
							}catch(error)
							{

							}
					}
				}
			}
		}
    
    
  }
}

